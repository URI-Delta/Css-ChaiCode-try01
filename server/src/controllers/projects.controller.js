import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { UserProject } from '../models/user-project.model.js';
import { ProjectTemplate } from '../models/project-template.model.js';
import { notFound, forbidden } from '../config/errors.js';
import { parsePagination, paginatedRes } from '../utils/pagination.js';
import { randomToken } from '../utils/crypto.js';

const router = Router();

const filesSchema = z.object({
  html: z.string().max(200_000).optional().default(''),
  css: z.string().max(200_000).optional().default(''),
  js: z.string().max(200_000).optional().default(''),
});

const createSchema = z.object({
  title: z.string().min(1).max(120).default('Untitled project'),
  templateId: z.string().max(64).optional(),
  templateSlug: z.string().max(120).optional(),
  files: filesSchema.optional(),
  forkedFrom: z.string().max(64).optional(),
});

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  files: filesSchema.optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
});

/* templates catalog (public) */
router.get(
  '/templates',
  asyncWrap(async (_req, res) => {
    const templates = await ProjectTemplate.find({ status: 'published' }).sort('order').lean();
    res.json({
      ok: true,
      templates: templates.map((t) => ({
        id: t._id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        emoji: t.emoji,
        difficulty: t.difficulty,
        accessLevel: t.accessLevel,
        objectives: t.objectives,
        requirements: t.requirements,
        starterFiles: t.starterFiles,
        estimatedMinutes: t.estimatedMinutes,
      })),
    });
  })
);

router.get(
  '/templates/:slug',
  asyncWrap(async (req, res) => {
    const t = await ProjectTemplate.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!t) throw notFound('Project not found');
    res.json({
      ok: true,
      template: {
        id: t._id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        emoji: t.emoji,
        difficulty: t.difficulty,
        accessLevel: t.accessLevel,
        objectives: t.objectives,
        requirements: t.requirements,
        starterFiles: t.starterFiles,
        hints: t.hints,
        estimatedMinutes: t.estimatedMinutes,
        completionCriteria: t.completionCriteria,
      },
    });
  })
);

/* user projects */
router.post(
  '/',
  authenticate,
  validate({ body: createSchema }),
  asyncWrap(async (req, res) => {
    const { title, templateId, templateSlug, files, forkedFrom } = req.body;
    let starter = null;
    if (templateId || templateSlug) {
      starter = await ProjectTemplate.findOne(templateId ? { _id: templateId } : { slug: templateSlug }).lean();
      if (!starter) throw notFound('Template not found');
    }
    const doc = await UserProject.create({
      userId: req.user.id,
      title,
      templateId: starter?._id,
      templateSlug: starter?.slug,
      forkedFrom,
      files: files || starter?.starterFiles || { html: '', css: '' },
    });
    res.status(201).json({ ok: true, project: publicProject(doc) });
  })
);

router.get(
  '/me',
  authenticate,
  asyncWrap(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 20, maxLimit: 60 });
    const [items, total] = await Promise.all([
      UserProject.find({ userId: req.user.id }).sort('-updatedAt').skip(skip).limit(limit).lean(),
      UserProject.countDocuments({ userId: req.user.id }),
    ]);
    res.json(paginatedRes(items.map(publicProject), total, { page, limit }));
  })
);

router.get(
  '/:id',
  authenticate,
  asyncWrap(async (req, res) => {
    const doc = await UserProject.findById(req.params.id).lean();
    if (!doc) throw notFound('Project not found');
    if (String(doc.userId) !== req.user.id && req.user.role !== 'admin' && doc.visibility === 'private') {
      throw forbidden('This project belongs to someone else');
    }
    res.json({ ok: true, project: publicProject(doc) });
  })
);

router.patch(
  '/:id',
  authenticate,
  validate({ body: patchSchema }),
  asyncWrap(async (req, res) => {
    const doc = await UserProject.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) throw notFound('Project not found or not yours');
    if (req.body.title != null) doc.title = req.body.title;
    if (req.body.files) doc.files = req.body.files;
    if (req.body.visibility) doc.visibility = req.body.visibility;
    doc.version += 1;
    await doc.save();
    res.json({ ok: true, project: publicProject(doc) });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncWrap(async (req, res) => {
    const doc = await UserProject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!doc) throw notFound('Project not found or not yours');
    res.json({ ok: true });
  })
);

router.post(
  '/:id/fork',
  authenticate,
  asyncWrap(async (req, res) => {
    const src = await UserProject.findById(req.params.id).lean();
    if (!src) throw notFound('Project not found');
    const shared = src.visibility !== 'private';
    if (String(src.userId) !== req.user.id && !shared) throw forbidden('Cannot fork a private project');
    const doc = await UserProject.create({
      userId: req.user.id,
      title: `${src.title} (fork)`,
      templateId: src.templateId,
      templateSlug: src.templateSlug,
      forkedFrom: src._id,
      files: src.files,
    });
    res.status(201).json({ ok: true, project: publicProject(doc) });
  })
);

router.post(
  '/:id/share',
  authenticate,
  asyncWrap(async (req, res) => {
    const doc = await UserProject.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) throw notFound('Project not found or not yours');
    doc.shareSlug ??= randomToken(12);
    doc.visibility = 'shared';
    await doc.save();
    res.json({ ok: true, shareSlug: doc.shareSlug, shareUrl: `/playground/shared/${doc.shareSlug}` });
  })
);

/** Read-only shared view (no auth needed) */
router.get(
  '/shared/:slug',
  asyncWrap(async (req, res) => {
    const doc = await UserProject.findOne({ shareSlug: req.params.slug, visibility: { $in: ['shared', 'public'] } }).lean();
    if (!doc) throw notFound('Shared project not found');
    res.json({ ok: true, project: { ...publicProject(doc), files: doc.files, ownerName: undefined } });
  })
);

function publicProject(doc) {
  return {
    id: doc._id,
    title: doc.title,
    templateSlug: doc.templateSlug,
    files: doc.files,
    visibility: doc.visibility,
    shareSlug: doc.shareSlug,
    version: doc.version,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

export default router;
