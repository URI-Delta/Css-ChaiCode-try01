import { LessonProgress } from '../models/lesson-progress.model.js';
import { Lesson } from '../models/lesson.model.js';
import { Track } from '../models/track.model.js';
import { ChallengeAttempt } from '../models/challenge-attempt.model.js';
import { UserProject } from '../models/user-project.model.js';
import { UserAchievement } from '../models/user-achievement.model.js';
import { Achievement } from '../models/achievement.model.js';

export async function upsertProgress(userId, lessonId, { completed, score }) {
  const update = { lastVisitedAt: new Date() };
  if (typeof completed === 'boolean') {
    update.completed = completed;
    update.completedAt = completed ? new Date() : null;
  }
  if (typeof score === 'number') update.score = Math.max(0, Math.min(100, Math.round(score)));

  return LessonProgress.findOneAndUpdate(
    { userId, lessonId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function progressFor(userId, lessonId) {
  return LessonProgress.findOne({ userId, lessonId }).lean();
}

/** Aggregated dashboard + progress stats — all derived from real records. */
export async function getDashboardStats(userId) {
  const [progressRecords, lessons, tracks, attempts, projects] = await Promise.all([
    LessonProgress.find({"userId": userId}).lean(),
    Lesson.find({ status: 'published' }).select('_id trackId title slug accessLevel order trackId').lean(),
    Track.find({ published: true }).sort('order').lean(),
    ChallengeAttempt.find({ userId }).sort({ attemptedAt: -1 }).limit(200).lean(),
    UserProject.find({ userId }).countDocuments(),
  ]);

  const progressByLesson = new Map(progressRecords.map((p) => [String(p.lessonId), p]));

  const trackStats = tracks.map((t) => {
    const trackLessons = lessons.filter((l) => String(l.trackId) === String(t._id));
    const done = trackLessons.filter((l) => progressByLesson.get(String(l._id))?.completed).length;
    return { trackId: String(t._id), title: t.title, slug: t.slug, emoji: t.emoji, total: trackLessons.length, completed: done };
  });

  const completedLessons = progressRecords.filter((p) => p.completed).length;
  const passedChallenges = attempts.filter((a) => a.passed);
  const uniquePassed = new Set(passedChallenges.map((a) => String(a.challengeId)));
  const attemptsInWindow = attempts.length;

  // learning streak: consecutive days with any activity (visits/attempts/projects converges via lastVisited)
  const activityDates = new Set();
  for (const p of progressRecords) {
    if (p.lastVisitedAt) activityDates.add(dayOf(p.lastVisitedAt));
    if (p.completedAt) activityDates.add(dayOf(p.completedAt));
  }
  for (const a of attempts) activityDates.add(dayOf(a.attemptedAt));
  const streak = computeStreak(activityDates);

  // recent completed lessons for "continue learning"
  const recent = progressRecords
    .filter((p) => p.lastVisitedAt)
    .sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt))
    .slice(0, 6)
    .map((p) => {
      const lesson = lessons.find((l) => String(l._id) === String(p.lessonId));
      if (!lesson) return null;
      const track = tracks.find((t) => String(t._id) === String(lesson.trackId));
      return {
        lessonId: String(p.lessonId),
        slug: lesson.slug,
        title: lesson.title,
        trackTitle: track?.title,
        trackSlug: track?.slug,
        completed: p.completed,
        lastVisitedAt: p.lastVisitedAt,
      };
    })
    .filter(Boolean);

  const last7 = weeklyActivity(progressRecords, attempts);

  const successRate = attemptsInWindow ? Math.round((passedChallenges.length / attemptsInWindow) * 100) : 0;

  return {
    lessonsTotal: lessons.length,
    lessonsCompleted: completedLessons,
    trackStats,
    challengesPassed: uniquePassed.size,
    challengeAttemptCount: attemptsInWindow,
    challengeSuccessRate: successRate,
    projectsCount: projects,
    streak,
    recent,
    weekly: last7,
  };
}

const dayOf = (d) => new Date(d).toISOString().slice(0, 10);

function computeStreak(dateSet) {
  let streak = 0;
  const cursor = new Date();
  // allow today to be empty without breaking yesterday's streak
  if (!dateSet.has(dayOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dateSet.has(dayOf(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weeklyActivity(progressRecords, attempts) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayOf(d);
    out.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      visited: progressRecords.filter((p) => dayOf(p.lastVisitedAt) === key).length,
      completed: progressRecords.filter((p) => dayOf(p.completedAt ?? p.lastVisitedAt) === key && p.completed).length,
      attempts: attempts.filter((a) => dayOf(a.attemptedAt) === key).length,
    });
  }
  return out;
}

/** Checks and awards any newly-earned achievements. Returns newly awarded ones. */
export async function checkAchievements(userId) {
  const stats = await getDashboardStats(userId);
  const all = await Achievement.find().sort('order').lean();
  const owned = new Set((await UserAchievement.find({ userId }).lean()).map((ua) => String(ua.achievementId)));

  const newly = [];
  for (const a of all) {
    if (owned.has(String(a._id))) continue;
    const c = a.criteria || {};
    const earned =
      stats.lessonsCompleted >= (c.lessons ?? Infinity) ||
      stats.challengesPassed >= (c.challengesPassed ?? Infinity) ||
      stats.projectsCount >= (c.projects ?? Infinity) ||
      stats.streak >= (c.streak ?? Infinity);
    if (earned) {
      await UserAchievement.updateOne({ userId, achievementId: a._id }, { $setOnInsert: { awardedAt: new Date() } }, { upsert: true });
      newly.push(a);
    }
  }
  return newly;
}

export async function achievementsFor(userId) {
  const [all, user] = await Promise.all([
    Achievement.find().sort('order').lean(),
    UserAchievement.find({ userId }).lean(),
  ]);
  const byId = new Map(user.map((ua) => [String(ua.achievementId), ua]));
  return all.map((a) => ({ ...a, awardedAt: byId.get(String(a._id))?.awardedAt ?? null }));
}
