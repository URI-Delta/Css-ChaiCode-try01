import { CHALLENGE_TYPES } from '../config/constants.js';

/* ─────────────────────────────────────────────────────────────
   Minimal, eval-free CSS text parser. Extracts rules of the form
   `selector { prop: value; ... }`, recursing through @media and
   @supports blocks and tagging them with their condition.
   ───────────────────────────────────────────────────────────── */

export function parseCss(text = '') {
  const rules = [];
  const src = String(text || '').replace(/\/\*[\s\S]*?\*\//g, ' ');
  let i = 0;
  let guard = 0;
  while (i < src.length && guard++ < 10_000) {
    const open = src.indexOf('{', i);
    if (open === -1) break;
    const selector = src.slice(i, open).replace(/[\n\r]/g, ' ').trim();
    let depth = 1;
    let j = open + 1;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }
    const body = src.slice(open + 1, Math.max(open + 1, j - 1));
    if (/^@(media|supports|container)/i.test(selector)) {
      rules.push(...parseCss(body).map((r) => ({ ...r, media: selector })));
    } else if (selector && !/^@/.test(selector)) {
      const declarations = {};
      for (const decl of body.split(';')) {
        const idx = decl.indexOf(':');
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim().toLowerCase();
        const val = decl.slice(idx + 1).trim();
        if (prop && val) declarations[prop] = val;
      }
      rules.push({ selector, declarations, media: null });
    }
    i = j;
  }
  return rules;
}

/** Does the final compound of a selector refer to this element?
 *  element: { tag?, classes?: string[], id? } — kept intentionally simple. */
export function selectorMatches(ruleSelector, element = {}) {
  const last = ruleSelector.split(/[\s>+~]+/).pop().trim();
  for (const s of last.split(',')) {
    const part = s.trim();
    if (!part) continue;
    if (part === '*') return true;
    if (/^\./.test(part)) {
      if (element.classes?.includes(part.slice(1))) return true;
      continue;
    }
    if (/^#/.test(part)) {
      if (element.id && part.slice(1) === element.id) return true;
      continue;
    }
    const tag = part.split(/[.#:[]/)[0];
    if (tag && tag.toLowerCase() !== (element.tag || '').toLowerCase()) continue;
    const cls = part.match(/\.([A-Za-z0-9_-]+)/);
    if (cls && !element.classes?.includes(cls[1])) continue;
    return true;
  }
  return false;
}

function checkValue(op, values, actual) {
  const vals = (values || []).map((v) => String(v).toLowerCase().trim());
  const a = String(actual ?? '').toLowerCase().trim();
  switch (op) {
    case 'equals':
      return vals.includes(a);
    case 'matches':
      return vals.length > 0 && new RegExp(vals[0], 'i').test(a);
    case 'any-of':
    case 'has':
    default:
      if (!vals.length) return actual != null && actual !== '';
      return vals.some((v) => a.includes(v));
  }
}

/** score + per-requirement feedback for code/visual/responsive challenges. */
export function gradeChallenge(challenge, submission) {
  const css = submission?.css || '';
  const facts = submission?.facts && typeof submission.facts === 'object' ? submission.facts : {};
  const parsed = parseCss(css);
  const rules = challenge.validation?.rules || [];

  const results = rules.map((rule) => {
    const check = rule.check || {};
    let passed = false;

    if (check.engine === 'css-ast') {
      const sel = check.selector;
      for (const r of parsed) {
        if (sel && !selectorMatches(r.selector, { classes: sel.startsWith('.') ? [sel.slice(1)] : [], tag: sel.startsWith('.') ? elementlessFallback(sel) : sel })) continue;
        const val = r.declarations[check.property?.toLowerCase?.() ?? ''];
        if (val != null && checkValue(check.op || 'has', check.values, val)) {
          passed = true;
          break;
        }
      }
    }

    // declarative: facts from the sandboxed harness (computed styles / geometry)
    if (!passed && check.engine === 'declarative' && check.property) {
      const fact = facts[check.property];
      if (fact != null) passed = checkValue(check.op || 'has', check.values, fact);
      // harden: also require the property to be present in the submitted CSS text
      if (passed && !css.includes(check.property.toLowerCase())) {
        const viaVendor = css.includes(`${check.property}`); // explict text presence
        if (!viaVendor) passed = false;
      }
    }

    return { id: rule.id, label: rule.label, passed };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = results.length > 0 && passedCount === results.length;
  const score = results.length ? Math.round((passedCount / results.length) * challenge.points) : 0;
  return { passed: allPassed, score: allPassed ? challenge.points : score, results };
}

function elementlessFallback(sel) {
  return sel.startsWith('.') ? 'div' : sel.split(/[\s.#][:[]/)[0] || 'div';
}

/** grade answer-based challenges (MCQ / fill-blank) — plain string comparison. */
export function gradeAnswer(challenge, submission) {
  const answer = String(submission?.answer ?? '').trim();
  const starter = challenge.starter || {};

  if (starter.correctIndex != null && answer !== '' && !Number.isNaN(Number(answer))) {
    return Number(answer) === Number(starter.correctIndex);
  }
  if (starter.answer != null) {
    const accept = [starter.answer, ...(starter.accept || [])].map((a) => String(a).trim().toLowerCase().replace(/\s+;/g, ';'));
    const norm = answer.toLowerCase().replace(/\s+;\s*$/, ';');
    return accept.some((a) => norm === a);
  }
  return false;
}

/** Public entrypoint: grade any challenge against a submission. */
export function gradeSubmission(challenge, submission) {
  if (challenge.type === CHALLENGE_TYPES.MULTIPLE_CHOICE || challenge.type === CHALLENGE_TYPES.FILL_BLANK) {
    const passed = gradeAnswer(challenge, submission);
    return { passed, score: passed ? challenge.points : 0, results: [{ id: 'answer', label: 'Correct answer', passed }] };
  }
  return gradeChallenge(challenge, submission);
}
