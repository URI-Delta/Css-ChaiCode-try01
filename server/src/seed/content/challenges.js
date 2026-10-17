/* Challenge seed content — validation rules are evaluated by grader.service.js. */
const r = (id, label, check) => ({ id, label, check });

export const challenges = [
  {
    title: 'Fill the Code — Centering',
    slug: 'fill-the-code-centering',
    type: 'fill-code',
    difficulty: 'beginner',
    accessLevel: 'free',
    points: 10,
    estimatedMinutes: 10,
    trackTag: 'layout',
    instructions: 'Complete the CSS so the `.box` is perfectly centered inside `.stage` using Flexbox. Do not use absolute positioning.',
    starter: {
      html: '<div class="stage"><div class="box">Center me</div></div>',
      css: `.stage {
  display: flex;
  justify-content: ???;
  align-items: center;
  height: 200px;
}
.box { padding: 16px; }`,
    },
    target: { notes: 'The box sits at the exact center of the stage, both axes.' },
    hints: [
      'justify-content positions items along the main (horizontal) axis.',
      'center is the value that leaves equal space on both sides.',
    ],
    solution: 'justify-content: center;',
    validation: {
      rules: [
        r('jc', 'Uses justify-content', { engine: 'css-ast', property: 'justify-content', op: 'equals', values: ['center'] }),
        r('ai', 'Uses align-items: center', { engine: 'css-ast', property: 'align-items', op: 'equals', values: ['center'] }),
      ],
    },
  },
  {
    title: 'Debug CSS — Broken Flex Row',
    slug: 'debug-css-broken-flex-row',
    type: 'debug',
    difficulty: 'beginner',
    accessLevel: 'free',
    points: 10,
    estimatedMinutes: 10,
    trackTag: 'layout',
    instructions: 'This flex row is supposed to lay the letters out in one wrapping row with 8px gaps, but the grip is off. Fix the CSS so the container uses flex with wrap and a normal gap.',
    starter: {
      html: '<div class="row"><span>A</span><span>B</span><span>C</span><span>D</span></div>',
      css: `.row {
  display: grid;
  gap: 8px;
  /* should be a one-dimensional flex row that wraps */
}
span { background: #21201a; padding: 8px; }`,
    },
    target: { notes: 'Row direction, wrap allowed, 8px gap.' },
    hints: ['Change display to flex.', 'Add flex-wrap: wrap so it can go to two lines on narrow screens.'],
    solution: 'display: flex; flex-wrap: wrap; gap: 8px;',
    validation: {
      rules: [
        r('flex', 'Uses display: flex', { engine: 'css-ast', property: 'display', op: 'equals', values: ['flex'] }),
        r('wrap', 'Enables flex-wrap', { engine: 'css-ast', property: 'flex-wrap', op: 'equals', values: ['wrap'] }),
        r('gap', 'Row gap is 8px', { engine: 'css-ast', property: 'gap', op: 'equals', values: ['8px'] }),
      ],
    },
  },
  {
    title: 'Visual Target — Stacked Card',
    slug: 'visual-target-stacked-card',
    type: 'visual-target',
    difficulty: 'intermediate',
    accessLevel: 'free',
    points: 15,
    estimatedMinutes: 15,
    trackTag: 'layout',
    instructions: 'Match the target card: relative positioning context, a badge absolutely placed top-right, and a box-shadow. Use the target CSS visually; bubble hints below.',
    starter: {
      html: '<div class="card"><span class="badge">NEW</span>Product</div>',
      css: `.card {
  /* position context here */
  background: #21201a;
  border-radius: 12px;
  padding: 24px;
}
.badge {
  /* pin top-right */
  background: #ff7a45;
  color: #0d0e09;
}`,
    },
    target: {
      css: '.card { position: relative; box-shadow: 0 8px 24px rgba(0,0,0,.35); }\n.badge { position: absolute; top: 8px; right: 8px; }',
      notes: 'Badge floats at top-right; drop shadow on parent.',
    },
    hints: [
      'position: relative on the parent makes it the reference for absolute children.',
      'The badge needs position: absolute; top/right offsets.',
    ],
    solution: '.card { position: relative; box-shadow: 0 8px 24px rgba(0,0,0,.35); } .badge { position: absolute; top: 8px; right: 8px; }',
    validation: {
      rules: [
        r('parent', 'Card is positioned relative', { engine: 'css-ast', property: 'position', op: 'equals', values: ['relative'] }),
        r('badge', 'Badge is absolute', { engine: 'css-ast', property: 'position', op: 'equals', values: ['absolute'] }),
        r('badge-top', 'Badge offset from top', { engine: 'css-ast', property: 'top', op: 'equals', values: ['8px'] }),
        r('badge-right', 'Badge offset from right', { engine: 'css-ast', property: 'right', op: 'equals', values: ['8px'] }),
        r('shadow', 'Card has a box-shadow', { engine: 'css-ast', property: 'box-shadow', op: 'has', values: [] }),
      ],
    },
  },
  {
    title: 'Responsive Challenge — Stack on Mobile',
    slug: 'responsive-challenge-stack-on-mobile',
    type: 'responsive',
    difficulty: 'intermediate',
    accessLevel: 'free',
    points: 15,
    estimatedMinutes: 15,
    trackTag: 'responsive',
    instructions: 'Make two columns become a single stacked column under 640px using a media query. In the Playground use the mobile preview button to verify visually.',
    starter: {
      html: '<div class="columns"><section>A</section><section>B</section></div>',
      css: `.columns { display: flex; gap: 16px; }

/* add a media query below to stack */
`,
    },
    target: { notes: 'At ≤640px, flex-direction: column.', },
    hints: [
      'Everything mobile-first: base already defaults to row, that is what you override.',
      '@media (max-width: 640px) converts to column.',
    ],
    solution: '@media (max-width: 640px) { .columns { flex-direction: column; } }',
    validation: {
      rules: [
        r('mq', 'Has a media query', { engine: 'css-ast', property: 'flex-direction', op: 'equals', values: ['column'] }),
      ],
    },
  },
  {
    title: 'Quiz — Specificity Ordering',
    slug: 'quiz-specificity-ordering',
    type: 'multiple-choice',
    difficulty: 'beginner',
    accessLevel: 'free',
    points: 5,
    trackTag: 'selectors',
    instructions: 'Which of these selectors targets an <a> with class "cta" that sits inside an article with id "post" and which one wins? Pick the rule order of the *strongest* selector.',
    starter: {
      question: 'Which selector has the HIGHEST specificity?',
      options: ['#post .cta', '.post .cta', 'a.cta', 'div#post a'],
      correctIndex: 0,
      explanation: 'id (100) beats classes; #post .cta = 110 vs others < 110. Note div#post a = 101.',
    },
    hints: ['Count id as 100, class as 10, tag as 1.', '#post .cta = 110.'],
    validation: { rules: [] },
  },
  {
    title: 'Fill in the Blank — box-sizing',
    slug: 'fill-blank-box-sizing',
    type: 'fill-blank',
    difficulty: 'beginner',
    accessLevel: 'free',
    points: 5,
    trackTag: 'box-model',
    instructions: 'Complete the CSS for box-sizing so that padding and border are INCLUDED in the width.',
    starter: {
      question: 'Complete this standard reset:',
      answer: 'border-box',
      accept: ['border-box'],
      answerHint: 'The value that includes padding + border inside width.',
    },
    hints: ['Two words, no hyphens.','It starts with b, ends with x.'],
    validation: { rules: [] },
  },
  {
    title: 'Debug — Collapsed Grid Gap',
    slug: 'debug-collapsed-grid-gap',
    type: 'debug',
    difficulty: 'intermediate',
    accessLevel: 'free',
    points: 10,
    trackTag: 'grid',
    instructions: 'The gallery should show equal 16px gaps between columns and rows, but the visual shows no gap. Fix it.',
    starter: {
      html: '<div class="gallery"><div>1</div><div>2</div><div>3</div><div>4</div></div>',
      css: `.gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* gap missing */
}`,
    },
    target: { notes: 'gap: 16px between everything.' },
    hints: ['There is a property literally called gap.', 'gap: 16px covers row and column gaps simultaneously.'],
    solution: 'gap: 16px; /* equivalently row-gap + column-gap */',
    validation: {
      rules: [r('gap', 'Declares 16px gap', { engine: 'css-ast', property: 'gap', op: 'equals', values: ['16px'] })],
    },
  },
  {
    title: 'Quiz — Flex alignment',
    slug: 'quiz-flex-alignment',
    type: 'multiple-choice',
    difficulty: 'beginner',
    accessLevel: 'free',
    points: 5,
    trackTag: 'flexbox',
    instructions: 'In a flex: row container, which property centers items on the vertical (cross) axis?',
    starter: { question: 'Which property centers items should be used?', options: ['justify-content', 'align-items', 'flex-align', 'vertical-align'], correctIndex: 1, explanation: 'align-items handles the cross axis. justify-content handles the main.' },
    hints: ['Cross axis = the axes running the other direction.', 'role: align-items.'],
    validation: { rules: [] },
  },
  {
    title: 'Pro Challenge — Sticky Navbar',
    slug: 'pro-sticky-navbar',
    type: 'debug',
    difficulty: 'intermediate',
    accessLevel: 'pro',
    points: 20,
    estimatedMinutes: 20,
    trackTag: 'position',
    instructions: 'Make the header sticky at the top of its scroll container with z-index 10 so it stays above content.',
    starter: {
      html: '<header>Nav</header><main>Lots of content…</main>',
      css: `header {
  background: #151610;
  /* sticky + on top */
}
main { padding: 16px; }`,
    },
    target: { notes: 'position: sticky; top: 0; z-index: 10.' },
    hints: ['position: sticky has to be combined with a top offset.', 'z-index applies once the element is positioned.'],
    solution: 'position: sticky; top: 0; z-index: 10;',
    validation: {
      rules: [
        r('sticky', 'Uses position: sticky', { engine: 'css-ast', property: 'position', op: 'equals', values: ['sticky'] }),
        r('top0', 'Sticks at top: 0', { engine: 'css-ast', property: 'top', op: 'equals', values: ['0'] }),
        r('z10', 'z-index of 10', { engine: 'css-ast', property: 'z-index', op: 'equals', values: ['10'] }),
      ],
    },
  },
  {
    title: 'Pro Challenge — Responsive Grid with auto-fill',
    slug: 'pro-responsive-grid-autofill',
    type: 'responsive',
    difficulty: 'advanced',
    accessLevel: 'pro',
    points: 20,
    estimatedMinutes: 20,
    trackTag: 'grid',
    instructions: 'Build a card gallery that always fills the row with as many ≥200px columns as fit. Use auto-fill + minmax only — no media queries.',
    starter: {
      html: '<div class="cards"><div>1</div><div>2</div><div>3</div></div>',
      css: `.cards {
  display: grid;
  /* template? */
  gap: 16px;
}`,
    },
    target: { notes: 'grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));' },
    hints: ['repeat() + auto-fill enumerates fit count for you.', 'minmax(min, max) — try 200px, 1fr.'],
    solution: 'grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));',
    validation: {
      rules: [
        r('repeat', 'Uses a repeat pattern', { engine: 'css-ast', property: 'grid-template-columns', op: 'has', values: ['repeat(', 'autofill'] }),
        r('minmax', 'Track floor is 200px via minmax', { engine: 'css-ast', property: 'grid-template-columns', op: 'has', values: ['200px'] }),
      ],
    },
  },
];

export const challengeBySlug = Object.fromEntries(challenges.map((c) => [c.slug, c]));
