import { Router } from 'express';
import authRouter from '../controllers/auth.controller.js';
import learningRouter from '../controllers/learning.controller.js';
import projectsRouter from '../controllers/projects.controller.js';
import challengesRouter from '../controllers/challenges.controller.js';
import aiRouter from '../controllers/ai.controller.js';
import billingRouter from '../controllers/billing.controller.js';
import meRouter from '../controllers/me.controller.js';
import adminRouter from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';

const api = Router();

api.get('/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

api.use('/auth', authRouter);
// learning routes live at the root (/tracks, /lessons, /progress/me, /achievements/me)
api.use('/', learningRouter);
api.use('/projects', projectsRouter);
api.use('/challenges', challengesRouter);
api.use('/ai', aiRouter);
api.use('/billing', billingRouter);
api.use('/me', meRouter);
api.use('/admin', authenticate, adminRouter);

export default api;
