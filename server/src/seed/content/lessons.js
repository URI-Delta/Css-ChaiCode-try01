/* Lesson seed content. Referenced by slug in seed.js to link tracks. */
const L = (title, slug, trackSlug, opts) => ({
  title,
  slug,
  trackSlug,
  ...opts,
});

export const lessons = [
  L('What CSS Actually Does', 'what-css-actually-does', 'css-foundations', {
    description: 'How the browser turns HTML + CSS into pixels — and why CSS is code.',
    objectives: ['Describe how the browser pairs CSS rules with HTML', 'Understand the cascade and inheritance at a high level', 'Write and read your first CSS rule'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 12,
    order: 1,
    visualizer: 'display',
    visualizerConfig: { display: 'block', count: 4 },
    content: `
CSS is the layer that tells the browser **how your HTML should look**. The browser itself decides almost none of the fun parts — margins, colors, fonts, layout. It reads your stylesheet, finds elements, and paints.

### Anatomy of a rule

\`\`\`css
h1 {
  color: crimson;
  font-size: 42px;
}
\`\`\`

- \`h1\` — the **selector**: which elements does this apply to?
- \`color: crimson;\` — a **declaration**: property + value.
- All the declarations between \`{ }\` form the rule.

### The cascade
When two rules conflict, the browser picks a winner:

1. **Specificity** — more precise selectors win (details in the next lesson).
2. **Order** — equal-specificity rules: the *last one* wins.
3. **!important** — trumps everything (use sparingly).

### Inheritance
Some properties (like \`color\` and \`font\`) flow from parents to children automatically. Boxes (\`margin\`, \`padding\`, \`border\`) do not.

\`\`\`html
<div style="color: purple">
  <p>I inherit purple.</p>
  <span>Me too.</span>
</div>
\`\`\`
`,
    codeExamples: [
      { label: 'Cascading example', language: 'css', code: '/* both apply; the second wins */\np { color: gray; }\np { color: #333; }', note: 'Same specificity → last rule wins.' },
    ],
    quiz: [
      { question: 'What part of a rule tells the browser WHICH elements it applies to?', options: ['The declaration', 'The property', 'The selector', 'The value'], correctIndex: 2, explanation: 'The selector matches elements; declarations describe what to change.' },
      { question: 'Two rules have equal specificity. Which wins?', options: ['The first one', 'The last one', 'A random one', 'Both apply equally'], correctIndex: 1, explanation: 'When specificity ties, source order decides — last one wins.' },
    ],
  }),

  L('Selectors & Specificity', 'selectors-and-specificity', 'css-foundations', {
    description: 'Target exactly the elements you want, and learn who wins when rules collide.',
    objectives: ['Use type, class, id and attribute selectors', 'Combine selectors and understand descendant relationships', 'Calculate specificity scores'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 2,
    visualizer: 'specificity',
    visualizerConfig: { selector: '.nav a.active' },
    content: `
Selectors are how you address elements. The main kinds:

\`\`\`css
p          { } /* type: every <p> */
.card      { } /* class: every element with class="card" */
#main      { } /* id: the single element with id="main" */
a:hover    { } /* interaction state */
a[disabled] { } /* attribute: <a disabled> */
li.active  { } /* combine: a <li> that also has .active */
\`\`\`

### Relationships
\`\`\`css
nav a        { } /* any <a> inside <nav> (descendant) */
nav > a      { } /* only direct children */
h2 + p       { } /* the <p> right after an <h2> */
p, .note     { } /* both selectors, shared rule */
\`\`\`

### Specificity scoring
Each selector earns points like a mini game:
- **id** = 100
- **class / pseudo-class / attribute** = 10
- **type (tag) / pseudo-element** = 1

\`\`\`
.nav a.active   → 100 + 10 + 10? 
\`\`\`
Careful: only count the *target* part: \`.nav\` (10) + \`a\` (1) + \`.active\` (10) = **21**, beating plain \`.nav a\` (11). Use the specificity visualizer to do this math forever.
`,
    codeExamples: [{ label: 'Specificity battle', language: 'css', code: '#btn { color: blue; }      /* 100 */\n.card #btn { color: red; }  /* 110 → wins */\nbutton { color: gray; }     /* 1 */', note: 'Even one class + id beats plain id selectors.' }],
    quiz: [
      { question: 'Which selector has the highest specificity?', options: ['.sidebar h3', '#title', 'div p span', '.menu li.active'], correctIndex: 1, explanation: 'An id (100) beats any combination of classes and tags.' },
      { question: '`.card .title` scores:', options: ['11', '20', '2', '1'], correctIndex: 1, explanation: 'Two classes = 10 + 10 = 20.' },
    ],
  }),

  L('Colors & Units', 'colors-and-units', 'css-foundations', {
    description: 'Every way to say “orange” (and size things properly).',
    objectives: ['Write colors with keywords, hex, rgb() and hsl()', 'Choose between px, em, rem, % and ch', 'Build gradients'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 12,
    order: 3,
    visualizer: 'color',
    visualizerConfig: { color: '#ff7a45', gradientAngle: 135 },
    content: `
### Colors
\`\`\`css
orange                       /* keyword */
#ff7a45                      /* hex */
rgb(255, 122, 69)            /* rgb() */
hsl(15, 100%, 64%)           /* hue, saturation, lightness — easiest for tweaking */
rgb(255 122 69 / 0.5)        /* with alpha */
\`\`\`

### Units
| Unit | Meaning | Typical use |
|------|---------|-------------|
| \`px\` | fixed pixels | borders, tiny details |
| \`rem\` | × root font-size (16px default) | spacing, type scale |
| \`em\` | × element font-size | component-local sizing |
| \`%\`  | share of parent | widths, padding |
| \`ch\` | width of a "0" | input sizes, editors |

### Gradients
\`\`\`css
background: linear-gradient(135deg, #ff7a45, #c9a24a);
background: radial-gradient(circle, #fff 20%, #151610 70%);
\`\`\`

Rems make the whole page rescale when the user changes their font size — that is why \`.card { padding: 1.5rem }\` beats \`24px\` for accessibility.
`,
    codeExamples: [{ label: 'Fluid card', language: 'css', code: '.card {\n  padding: 1.5rem;             /* 24px, but scales */\n  background: linear-gradient(180deg, #21201a, #1b1a15);\n}', note: '' }],
    quiz: [
      { question: 'With the default root font-size of 16px, 2rem equals:', options: ['20px', '16px', '32px', '2%'], correctIndex: 2, explanation: '2 × 16px = 32px.' },
      { question: 'Which format makes lightening/darkening easiest?', options: ['hex', 'hsl()', 'keyword', 'it is identical in all'], correctIndex: 1, explanation: 'hsl() exposes lightness — change one number to darken.' },
    ],
  }),

  L('The Box Model', 'the-box-model', 'css-foundations', {
    description: 'Margin, border, padding and content — the geometry underneath everything.',
    objectives: ['Visualize the four layers of the box model', 'Predict total element size', 'Switch sizing with box-sizing'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 4,
    visualizer: 'box-model',
    visualizerConfig: { margin: 16, borderWidth: 2, padding: 12, contentWidth: 120, contentHeight: 80 },
    content: `
Every element is a rectangle with four layers, from inside out:

1. **Content** — the text/image box.
2. **Padding** — transparent breathing room *inside* the border.
3. **Border** — the visible edge.
4. **Margin** — invisible space *pushing neighbors away*.

\`\`\`css
.card {
  padding: 16px;
  border: 2px solid #302d25;
  margin: 24px;
}
\`\`\`

### The default trap
By default, \`width\` refers **only to content** — padding and border are added on top:
\`total = width + padding×2 + border×2\`. A \`width: 100px\` box with \`20px\` padding and a \`2px\` border is really **144px** wide.

The almost-universal fix:

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box; /* width now includes padding + border */
}
\`\`\`
`,
    codeExamples: [{ label: 'The reset', language: 'css', code: '*, *::before, *::after { box-sizing: border-box; }', note: 'Number one line in nearly every stylesheet.' }],
    quiz: [
      { question: 'With `box-sizing: content-box`, a `width: 150px` + `padding: 10px` + `border: 2px` box is:', options: ['150px', '170px', '172px', '174px'], correctIndex: 3, explanation: '150 + 10×2 + 2×2 = 174px.' },
      { question: 'Which layer is transparent space pushing adjacent elements away?', options: ['padding', 'margin', 'border', 'content'], correctIndex: 1, explanation: 'Margin is outside the border and does not accept backgrounds.' },
    ],
  }),

  L('The Display Property', 'the-display-property', 'layout', {
    description: 'Block, inline, inline-block, flex, grid and none — the least-appreciated switch in CSS.',
    objectives: ['Explain how each display value changes flow', 'Recognize when to use inline-block vs block', 'Use display: none deliberately'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 12,
    order: 1,
    visualizer: 'display',
    visualizerConfig: { display: 'block', count: 5 },
    content: `
Every element responds to \`display\`:

- **block** — new line before/after, full available width. Divs, headings.
- **inline** — flows like text, no margins on vertical sides. Spans.
- **inline-block** — flows like text but accepts width/height and vertical margins.
- **flex** — becomes a *flex container*; children obey flexbox.
- **grid** — children obey grid rules.
- **none** — removed from rendering entirely (unlike \`visibility: hidden\`, which stays invisible but occupies space).

\`\`\`css
.button { display: inline-block; } /* sized + flows in text */
.secret { display: none; }        /* gone from layout */
\`\`\`

Tip: HTML tags have sensible *default* display values (a \`<div>\` is block, a \`<span>\` inline), but you may override them freely.
`,
    codeExamples: [{ label: 'Flow comparison', language: 'css', code: 'span.demo { display: inline; }      /* hugs text */\nspan.demo { display: inline-block; } /* boxes that flow */', note: '' }],
    quiz: [
      { question: 'Which display value removes an element from layout completely?', options: ['visibility: hidden', 'opacity: 0', 'display: none', 'inline'], correctIndex: 2, explanation: 'display: none frees its space; the first two leave a gap.' },
      { question: 'You need a box that accepts width AND flows with text. Pick:', options: ['block', 'inline', 'inline-block', 'grid'], correctIndex: 2, explanation: 'inline-block gives both.' },
    ],
  }),

  L('Flexbox', 'flexbox', 'layout', {
    description: 'One-dimensional layout: rows, columns and the space between.',
    objectives: ['Create flex containers and control direction', 'Master justify-content and align-items', 'Use flex-wrap, gap and flex-grow'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 20,
    order: 2,
    visualizer: 'flexbox',
    visualizerConfig: { direction: 'row', justify: 'flex-start', align: 'stretch', wrap: 'nowrap', gap: 8, count: 5 },
    content: `
Flexbox answers one axis: *how do these children arrange next to each other?*

\`\`\`css
.row {
  display: flex;
  flex-direction: row;       /* or column */
  justify-content: center;   /* main axis */
  align-items: center;       /* cross axis */
  gap: 12px;                 /* modern spacing */
  flex-wrap: wrap;           /* allow new lines */
}
\`\`\`

### The two axes
With \`flex-direction: row\`, the main axis is horizontal: \`justify-content\` positions along it, \`align-items\` down across it. Swap to \`column\` and the roles flip.

### The children
\`\`\`css
.item:nth-child(2) {
  flex: 1;        /* grow to fill leftover space */
  flex-shrink: 0; /* refuse to shrink */
}
\`\`\`

### Centering anything
\`\`\`css
.parent { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
\`\`\`
The holy grail of centering — three lines.
`,
    codeExamples: [{ label: 'Navbar row', language: 'css', code: 'nav ul { display: flex; gap: 1rem; align-items: center; }\nnav .spacer { flex: 1; } /* pushes logo left, links right */', note: 'A flex item with flex:1 acts as a spacer.' }],
    quiz: [
      { question: 'In `flex-direction: row`, which property positions items along the horizontal axis?', options: ['align-items', 'justify-content', 'gap', 'flex-wrap'], correctIndex: 1, explanation: 'justify-content controls the main axis.' },
      { question: 'A flex item with `flex: 1` …', options: ['stays its natural size', 'grows to fill free space', 'wraps to a new line', 'ignores the container'], correctIndex: 1, explanation: 'flex-grow: 1 shares leftover space.' },
    ],
  }),

  L('CSS Grid', 'css-grid', 'layout', {
    description: 'Two-dimensional layout: rows AND columns, for page skeletons and card grids.',
    objectives: ['Define tracks with grid-template-columns/rows', 'Use gap and alignment', 'Place and span items'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 20,
    order: 3,
    visualizer: 'grid',
    visualizerConfig: { columns: 3, rows: 2, gap: 12, align: 'stretch', justify: 'stretch' },
    content: `
Grid is the layout tool for *full* pages:

\`\`\`css
.layout {
  display: grid;
  grid-template-columns: 1fr 2fr; /* 1:2 sidebar/content */
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  min-height: 100vh;
}
\`\`\`

### Track units
- \`fr\` — fraction of leftover space.
- \`auto\` — content’s intrinsic size.
- \`repeat(3, 1fr)\` — shorthand for three equal columns.
- \`minmax(200px, 1fr)\` — floor and ceiling in one.

### Spanning
\`\`\`css
.hero {
  grid-column: 1 / -1;  /* across all columns */
}
.widget {
  grid-row: span 2;
}
\`\`\`

### Classic card grid
\`\`\`css
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
\`\`\`
Responsive with zero media queries.
`,
    codeExamples: [{ label: 'Responsive grid', language: 'css', code: '.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }', note: 'auto-fill + minmax = responsive without media queries.' }],
    quiz: [
      { question: 'Which unit represents a share of the free space?', options: ['px', 'rem', 'fr', 'ch'], correctIndex: 2, explanation: 'fr = fraction.' },
      { question: '`grid-column: 1 / -1` means:', options: ['first column only', 'hide the item', 'span from first to last column', 'last column only'], correctIndex: 2, explanation: '-1 refers to the final line.' },
    ],
  }),

  L('Position', 'position', 'layout', {
    description: 'static, relative, absolute, fixed and sticky — and how they escape normal flow.',
    objectives: ['Predict each position value’s behavior', 'Anchor absolutely-positioned children to parents', 'Build a sticky header'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 4,
    visualizer: 'position',
    visualizerConfig: { position: 'static', offsetTop: 20, offsetLeft: 20 },
    content: `
- **static** — default; in normal flow.
- **relative** — normal space is kept, but \`top/right/bottom/left\` *nudge the paint*; also the anchor for absolute children.
- **absolute** — pulled out of flow; positioned against the nearest **positioned** ancestor.
- **fixed** — glued to the viewport; never moves when scrolling.
- **sticky** — normal until it crosses a threshold, then sticks.

\`\`\`css
.card { position: relative; }            /* the anchor */
.badge { position: absolute; top: -8px; right: -8px; }

.header { position: sticky; top: 0; z-index: 10; background: #151610; }
.toast  { position: fixed; bottom: 20px; right: 20px; }
\`\`\`
Watch the Position visualizer: switch to \`absolute\` and see the element fall out of flow; toggle \`sticky\` while scrolling the stage.
`,
    codeExamples: [{ label: 'Corner badge', language: 'css', code: '.parent { position: relative; }\n.child  { position: absolute; top: 0; right: 0; transform: translate(50%, -50%); }', note: 'transform centers it perfectly on the corner.' }],
    quiz: [
      { question: 'An absolutely positioned element resolves against:', options: ['the viewport', 'the nearest positioned ancestor', 'the body always', 'its own flow position'], correctIndex: 1, explanation: 'That is why you add position: relative to parents.' },
      { question: 'The value that keeps an element visible during scroll after passing a threshold:', options: ['fixed', 'absolute', 'sticky', 'relative'], correctIndex: 2, explanation: 'sticky.' },
    ],
  }),

  L('Responsive Basics', 'responsive-basics', 'responsive-css', {
    description: 'Media queries, relative units and the mobile-first mindset.',
    objectives: ['Write min-width media queries', 'Think mobile-first', 'Use fluid units with clamp()'],
    difficulty: 'beginner',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 1,
    visualizer: 'responsive',
    visualizerConfig: { breakpoint: 768, selectorWidth: 100 },
    content: `
Responsive design = one layout that adapts. Mobile-first means you *start* styling for small screens, then add enhancements:

\`\`\`css
/* base: mobile */
.cards { display: flex; flex-direction: column; }

@media (min-width: 768px) {
  .cards { flex-direction: row; }
}

@media (min-width: 1080px) {
  .cards { max-width: 1100px; margin-inline: auto; }
}
\`\`\`

### Fluid sizing without breakpoints
\`\`\`css
h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
/* min 2rem, ideal 5% viewport, max 3.5rem */
\`\`\`

### Meta viewport
Never forget in your HTML:
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1" />
\`\`\`
`,
    codeExamples: [{ label: 'Fluid heading', language: 'css', code: 'h1 { font-size: clamp(2rem, 5vw, 3.5rem); }', note: 'Scales with the viewport between tight bounds.' }],
    quiz: [
      { question: 'What change does `min-width: 768px` describe?', options: ['largest mobile screen', 'screen of 768px and wider', 'viewport height', 'zoom level'], correctIndex: 1, explanation: 'min-width = width ≥ 768px.' },
      { question: 'clamp(1rem, 4vw, 3rem) returns 5vw*viewport…', options: ['always 5vw', 'never above 3rem', 'always 3rem', ' Baltimore? no'], correctIndex: 1, explanation: 'It is capped at the max bound.' },
    ],
  }),

  L('Keyframe Animations', 'keyframe-animations', 'css-animations', {
    description: 'Transitions and @keyframes that make interfaces feel alive.',
    objectives: ['Animate with transitions for state changes', 'Build looping animations with @keyframes', 'Choose performant properties'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 18,
    order: 1,
    visualizer: 'animation',
    visualizerConfig: { duration: 1.2, easing: 'ease-in-out', name: 'pulse' },
    content: `
### Transitions
A transition automatically interpolates between two states:

\`\`\`css
.button { background: #ff7a45; transition: background .3s ease, transform .2s ease; }
.button:hover { background: #ff8d61; transform: translateY(-2px); }
\`\`\`

### Keyframes
For animation that runs without user input:

\`\`\`css
@keyframes float {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}
.floaty { animation: float 3s infinite ease-in-out; }
\`\`\`

### Performance rules
Animate only **transform** and **opacity** when possible — they skip layout and paint:

\`\`\`css
/* BAD: triggers layout each frame */
.whisper { animation: breathe 2s infinite; }
@keyframes breathe { 50% { width: 200px; } }

/* GOOD: compositor-only */
@keyframes breathe { 50% { transform: scale(1.1); opacity: .9; } }
\`\`\`

And always respect users who disable motion:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
\`\`\`
`,
    codeExamples: [{ label: 'Reduced motion override', language: 'css', code: '@media (prefers-reduced-motion: reduce) {\n  * { animation-duration: .01ms !important; };\n}', note: 'Honors OS-level accessibility preference.' }],
    quiz: [
      { question: 'Which two properties are safest to animate for performance?', options: ['margin/position', 'transform/opacity', 'width/height', 'all equally'], correctIndex: 1, explanation: 'They are compositor-only — no re-layout or repaint.' },
      { question: '`animation: pulse 2s infinite linear;` — what is 2s?', options: ['delay', 'duration per loop', 'total lifetime', 'opacity'], correctIndex: 1, explanation: 'It is the duration of one iteration.' },
    ],
  }),

  L('clamp(), min() & max()', 'clamp-min-max', 'responsive-css', {
    description: 'Modern math functions that replace whole sections of media-query code.',
    objectives: ['Describe clamp(min, preferred, max) behavior', 'Use min()/max() for adaptive sizing', 'Build fluid typography'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 12,
    order: 2,
    visualizer: 'responsive',
    visualizerConfig: { breakpoint: 1024, selectorWidth: 100 },
    content: `
These functions make CSS compute values *for you*.

### clamp()
\`\`\`css
font-size: clamp(min, fluid, max);
font-size: clamp(1.25rem, 2.5vw, 2rem);
\`\`\`
Whatever the viewport, the result never escapes the bounds.

### min() / max()
\`\`\`css
width: min(100vw, 1100px);   /* full width, but not enormous on huge screens */
padding: max(1rem, 3vw);
\`\`\`

### Combined
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
}
\`\`\`
Grid track that respects both fluid *and* fixed logic — no media query. This is the modern responsive toolkit.
`,
    codeExamples: [{ label: 'Capped fluid padding', language: 'css', code: 'section { padding: clamp(1rem, 4vw, 3rem); }', note: 'Padding scales smoothly with the viewport, then stops.' }],
    quiz: [
      { question: 'clamp(1rem, 4vw, 3rem) with a viewport where 4vw = 2.5rem returns…', options: ['1rem', '2.5rem', '3rem', '4vw'], correctIndex: 1, explanation: 'The preferred 4vw value when it falls within bounds.' },
      { question: 'min(100vw, 1100px) is what on a 1920px-wide screen?', options: ['100vw', '1100px', '1920px', 'uncalculatable'], correctIndex: 1, explanation: 'min picks the smaller — 1100px.' },
    ],
  }),

  L('Conflict & Layer Management', 'conflict-and-layers', 'css-architecture', {
    description: 'Cascading Layers (@layer), specificity hygiene and organic growth plans.',
    objectives: ['Structure styles in layers', 'Resolve specificity wars without !important', 'Understand BEM-ish naming'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 1,
    visualizer: 'specificity',
    visualizerConfig: { selector: '.card > .card__title' },
    content: `
When CSS files grow, collisions start. Give orders:

\`\`\`css
@layer base, components, utilities;

@layer base {
  .button { border-radius: 8px; padding: .6rem 1rem; }
}

@layer components {
  .button.primary { background: #ff7a45; }
}

@layer utilities {
  .mt-4 { margin-top: 1rem; }
}
\`\`\`

Layer *order* is the tie-breaker: \`utilities\` late means they always win — neatly, without \`!important\`.

### Naming
BEM (\`.block__element--modifier\`) gives predictable names:

\`\`\`css
.card { }
.card__title { }
.card--featured { }
\`\`\`
Combined with layers, ten thousand lines stop feeling like quicksand.
`,
    codeExamples: [{ label: 'Layer reset order', language: 'css', code: '@layer reset, base, components, utilities;', note: 'Declare the cascade once; later @layer blocks slot into those positions.' }],
    quiz: [
      { question: 'In `@layer a, b;`, which layer wins conflicts?', options: ['a', 'b', 'whichever was written last in code', 'random'], correctIndex: 1, explanation: 'Later-declared layers have priority.' },
      { question: 'BEM stands for:', options: ['Block Element Modifier', 'Box Model Element', 'Build Each Modular', 'Basic Element Method'], correctIndex: 0, explanation: 'block__element--modifier.' },
    ],
  }),

  L('Custom Properties & z-index Stack', 'custom-properties-and-z-index', 'advanced-css', {
    description: 'Theming with CSS variables and controlling stacking order properly.',
    objectives: ['Define and use custom properties', 'Scope variable overrides intelligently', 'Predict stacking with z-index + stacking contexts'],
    difficulty: 'advanced',
    accessLevel: 'pro',
    estimatedMinutes: 15,
    order: 1,
    visualizer: 'stacking',
    visualizerConfig: { zIndexA: 10, zIndexB: 50 },
    content: `
### Custom properties
\`\`\`css
:root {
  --brand: #ff7a45;
  --surface: #151610;
  --radius: 12px;
}
.card { border-radius: var(--radius); background: var(--surface); }
\`\`\`
They inherit and recompute per element:

\`\`\`css
.card.featured { --brand: #c9a24a; } /* gold accent inside this card only */
\`\`\`

### The stacking story
\`z-index\` only matters among elements in the same **stacking context**. Common surprise: a transformed/flex-child parent *creates a new context*, so its children can never rise above that parent’s neighbors no matter how huge the number.

\`\`\`css
.header { position: fixed; z-index: 50; }        /* plane 1 */
.modal  { position: fixed; left: 0; right: 0; top: 10vh; z-index: 100; } /* above */
.toast  { position: fixed; bottom: 20px; z-index: 200; } /* always above modal */
\`\`\`

Keep a small, documented scale (10, 50, 100, 200) rather than adding +1 forever. Use the Stacking visualizer to see contexts form around transforms and opacity.
`,
    codeExamples: [{ label: 'Context trap', language: 'css', code: '.group { transform: translateZ(0); z-index: 1; }  /* creates a context, child z-index: 999 stays INSIDE */\n.group .child { z-index: 999; }', note: 'This is a classic debugging surprise.' }],
    quiz: [
      { question: 'Which creates a new stacking context?', options: ['position: relative alone', 'opacity: 0.9', 'z-index: auto', 'display: block'], correctIndex: 1, explanation: 'Opacity below 1 creates one — a gotcha.' },
      { question: 'Best practice for z-index:', options: ['random huge numbers', 'one global scale, documented', 'z-index: -9999 always', 'only !important'], correctIndex: 1, explanation: 'Tiers keep it debuggable.' },
    ],
  }),

  L('Design Tokens in Practice', 'design-tokens-in-practice', 'css-architecture', {
    description: 'A real brand kit: variables, scales and utilities that stay manageable.',
    objectives: ['Build a token file', 'Create type and spacing scales', 'Write utilities without fighting specificity'],
    difficulty: 'intermediate',
    accessLevel: 'free',
    estimatedMinutes: 15,
    order: 2,
    visualizer: 'typography',
    visualizerConfig: { family: 'Inter', size: 1.5, lineHeight: 1.6 },
    content: `
A token file is just variables:

\`\`\`css
:root {
  --color-bg: #0d0e09;
  --color-surface: #151610;
  --color-brand: #ff7a45;
  --radius-md: 12px;
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --text-xs: .75rem; --text-sm: .875rem; --text-md: 1rem;
}
\`\`\`

### Scales beat eyeballing
Spacing multiples of 4px; type in a ratio (1.25, 1.5) — like musical scales, your UI starts humming together.

### Utilities
\`\`\`css
.card { padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-surface); }
\`\`\`
Every new component *inherits* look decisions automatically. That is what makes a UI consistent.
`,
    codeExamples: [{ label: 'Dark-to-light theming switch', language: 'css', code: '[data-theme="light"] {\n  --color-bg: #faf6ee;\n  --color-surface: #fff;\n}', note: 'One attribute flips the whole theme.' }],
    quiz: [
      { question: 'The x264 of CSS theming — switching themes uses:', options: ['two stylesheets', 'custom property overrides', 'duplicate markup', 'media queries only'], correctIndex: 1, explanation: 'Override tokens under a scope like [data-theme="light"]; components need no changes.' },
      { question: 'Spacing multiples of 4px create:', options: ['infinite sizes', 'visual rhythm', 'bugs', 'rounded corners'], correctIndex: 1, explanation: 'Consistent scale = rhythm.' },
    ],
  }),

  L('Transforms & 3D', 'transforms-and-3d', 'advanced-css', {
    description: 'The transform property: translate, scale, rotate, skews, and perspective.',
    objectives: ['Apply transforms without breaking layout', 'Layer transforms in one property', 'Build 3D cards with perspective'],
    difficulty: 'advanced',
    accessLevel: 'pro',
    estimatedMinutes: 15,
    order: 2,
    visualizer: 'stacking',
    visualizerConfig: { zIndexA: 1, zIndexB: 20, rotate: 8 },
    content: `
\`transform\` repaints without reflowing the page:

\`\`\`css
.badge { transform: translate(4px, -4px) rotate(8deg) scale(1.05); }
\`\`\`

### Pitfalls
- Transitions on pre-transform (translate, skew) persist even on untransformed siblings.
- The \`\`transform-origin\`\` point matters for rotation.
- transforms create **stacking contexts** (see previous lesson).

### 3D
\`\`\`css
.scene { perspective: 600px; }
.card  { transform: rotateY(25deg); transition: transform .4s; }
.scene:hover .card { transform: rotateY(0deg); }
\`\`\`

Use the Stacking visualizer’s \`rotate\` slider to watch a context “escape” or contain children.
`,
    codeExamples: [{ label: 'Hover lift', language: 'css', code: '.card { transition: transform .2s ease; }\n.card:hover { transform: translateY(-6px); }', note: 'GPU-accelerated hover effect.' }],
    quiz: [
      { question: 'Which transform order makes interactive cards feel right?', options: ['translate then scale', 'scale then translate', 'does not matter', 'cannot combine'], correctIndex: 2, explanation: 'Transforms combine multiplicatively; order matters visually, but there is no universal rule.' },
      { question: 'transform creates:', options: ['global variables', 'a new stacking context', 'layout reflow', 'a media query'], correctIndex: 1, explanation: 'Always a new stacking context.' },
    ],
  }),
];

/* Validation: quiz indexes handled by the UI; slugs are referenced by seed.js makeup */
export const lessonBySlug = Object.fromEntries(lessons.map((l) => [l.slug, l]));
