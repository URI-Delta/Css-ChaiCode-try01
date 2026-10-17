import { badRequest } from '../config/errors.js';

/** Parses ?page&limit safely with bounds. Returns { page, limit, skip }. */
export function parsePagination(query, defaults = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(defaults.maxLimit || 60, Math.max(1, parseInt(query.limit, 10) || defaults.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedRes(items, total, { page, limit }) {
  return {
    items,
    page,
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}
