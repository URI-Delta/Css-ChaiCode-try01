export const ROLES = { USER: 'user', ADMIN: 'admin' };
export const PLANS = { FREE: 'free', PRO: 'pro' };
export const USER_STATUS = { ACTIVE: 'active', SUSPENDED: 'suspended' };
export const ACCESS = { FREE: 'free', PRO: 'pro' }; // content access levels
export const CONTENT_STATUS = { PUBLISHED: 'published', DRAFT: 'draft' };
export const CHALLENGE_TYPES = {
  FILL_CODE: 'fill-code',
  DEBUG: 'debug',
  VISUAL_TARGET: 'visual-target',
  RESPONSIVE: 'responsive',
  MULTIPLE_CHOICE: 'multiple-choice',
  FILL_BLANK: 'fill-blank',
};
export const DIFFICULTY = { BEGINNER: 'beginner', INTERMEDIATE: 'intermediate', ADVANCED: 'advanced' };

/** Which validation engines challenges may declare in their validationConfig. */
export const VALIDATION_ENGINES = {
  DECLARATIVE: 'declarative', // CSS-style rule checks against rendered/serialized styles
  ANSWER: 'answer', // exact/regex answer comparison (MCQ, fill-in-the-blank)
  CSS_AST: 'css-ast', // text-level CSS checks (declared properties/values), no eval
};
