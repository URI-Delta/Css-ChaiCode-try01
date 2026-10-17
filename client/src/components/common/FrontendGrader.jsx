/** Light client-side helper for project completion guidance.
 *  (Challenge scoring and entitlements always run server-side.) */
const check = (files, criteria) => {
  if (!criteria?.length) return true;
  return criteria.some((crit) => {
    const text = files?.css || '';
    const sel = (crit.selector || '').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const value = (crit.values?.[0] || '').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (!crit.property) return true;
    const re = new RegExp(`${sel ? `[^.{]*${sel}` : '[^{]*'}\\s*\\{[^}]*\\b${crit.property}\\b\\s*:\\s*[^;}]*${value}`, 'i');
    return re.test(text);
  });
};

export default { check };
