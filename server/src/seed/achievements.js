import { Achievement } from '../models/achievement.model.js';

const definitions = [
  { title: 'First Steps', description: 'Completed your first lesson', icon: '🎯', criteria: { lessons: 1 }, order: 0 },
  { title: 'Foundations Laid', description: 'Completed the CSS Foundations track', icon: '🧱', criteria: { lessons: 4 }, order: 1 },
  { title: 'Flex Master', description: 'Passed your first 3 challenges', icon: '💪', criteria: { challengesPassed: 3 }, order: 2 },
  { title: 'Builder', description: 'Completed your first project', icon: '🏗️', criteria: { projects: 1 }, order: 3 },
  { title: 'Streak Starter', description: '5-day learning streak', icon: '🔥', criteria: { streak: 5 }, order: 4 },
  { title: 'Halfway Hero', description: 'Completed 10 lessons', icon: '⭐', criteria: { lessons: 10 }, order: 5 },
  { title: 'Challenge Champion', description: 'Passed 10 challenges', icon: '🏆', criteria: { challengesPassed: 10 }, order: 6 },
  { title: 'Portfolio Prospector', description: 'Completed 5 projects', icon: '🎨', criteria: { projects: 5 }, order: 7 },
  { title: 'CSS Devotee', description: 'Completed 20 lessons', icon: '🥇', criteria: { lessons: 20 }, order: 8 },
  { title: 'Marathon Mind', description: '14-day learning streak', icon: '📅', criteria: { streak: 14 }, order: 9 },
];

export async function ensureSeedAchievements() {
  const count = await Achievement.estimatedDocumentCount();
  if (count >= definitions.length) return;
  for (const def of definitions) {
    const exists = await Achievement.findOne({ title: def.title });
    if (!exists) await Achievement.create(def);
  }
  return Achievement.countDocuments();
}
