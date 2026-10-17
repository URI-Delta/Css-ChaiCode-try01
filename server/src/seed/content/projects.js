/* Project seed templates — starter files users fork into their workspace. */
const p = (title, slug, emoji, difficulty, opts) => ({
  title,
  slug,
  emoji,
  difficulty,
  ...opts,
});

const reset = '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; background: #0d0e09; color: #eee8d8; font-family: system-ui, Inter, sans-serif; }';

export const projects = [
  p('Profile Card', 'profile-card', '👤', 'beginner', {
    description: 'A centered user profile card with avatar, name, bio and social buttons.',
    objectives: ['Compose a card layout', 'Style avatars and percentages', 'Center content with flexbox'],
    requirements: ['Avatar image is a circle', 'Name and bio in stacked layout', 'Buttons link row with even gap', 'Border and background match the target'],
    estimatedMinutes: 30,
    order: 1,
    starterFiles: {
      html: '<div class="card"><img class="avatar" src="https://i.pravatar.cc/96" alt="Profile avatar"/><h1>Jane Dev</h1><p>Frontend developer who loves CSS.</p><div class="social"><a href="#">GitHub</a><a href="#">Twitter</a><a href="#">Website</a></div></div>',
      css: reset + `
.card {
  max-width: 320px;
  margin: 48px auto;
  padding: 24px;
  text-align: center;
  background: #151610;
  border: 1px solid #302d25;
  border-radius: 16px;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
}

.social {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.social a { color: #ff7a45; text-decoration: none; font-size: .9rem; }`,
    },
    completionCriteria: [
      { label: 'Card centered horizontally', property: 'margin-inline', op: 'has', selectors: ['.card'], selector: '.card', values: ['auto'] },
      { label: 'Rounded avatar', property: 'border-radius', selector: '.avatar', values: ['50%'], op: 'equals' },
    ],
  }),
  p('Button Collection', 'button-collection', '🔘', 'beginner', {
    description: 'A set of buttons demonstrating hover states, disabled style, and outline variants.',
    objectives: ['Style buttons in multiple states', 'Use transitions on hover', 'Compose pseudo-classes'],
    requirements: ['At least three distinct button variants', 'Hover state on primary button', 'Disabled style visible', 'All transitions ≤ 300ms'],
    estimatedMinutes: 30,
    order: 2,
    starterFiles: {
      html: '<div class="row"><button class="btn primary">Primary</button><button class="btn primary" disabled>Disabled</button><button class="btn primary outline">Outline</button></div>',
      css: reset + `
body { display: grid; place-items: center; min-height: 100vh; }
.row { display: flex; gap: 16px; }

.btn {
  padding: 12px 20px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
}

.primary {
  background: #ff7a45;
  color: #0d0e09;
}

.btn:hover:not(:disabled) { background: #ff8d61; }

.btn:disabled { opacity: .5; cursor: not-allowed; }

.outline { background: transparent; border-color: #ff7a45; color: #ff7a45; }`,
    },
    completionCriteria: [],
  }),
  p('Responsive Navbar', 'responsive-navbar', '🧭', 'intermediate', {
    description: 'A navbar that collapses into a hamburger menu on mobile, using modern CSS.',
    objectives: ['Flexbox header with logo + links', 'Media query collapse behavior', 'Sanity-check with a mobile viewport'],
    requirements: ['Links laid out horizontally on desktop', 'At 640px and below links become a vertical stack', 'Sticky header at top with shadow'],
    estimatedMinutes: 40,
    order: 3,
    starterFiles: {
      html: '<header class="nav"><a class="logo" href="#">CSS Visual</a><nav class="links"><a href="#">Learn</a><a href="#">Playground</a><a href="#">Pricing</a></nav><button class="burger">☰</button></header><main style="padding:24px"><p>Try scaling the preview below 640px.</p></main>',
      css: reset + `
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #151610;
  border-bottom: 1px solid #302d25;
}

.links { display: flex; gap: 16px; }
.links a { color: #eee8d8; text-decoration: none; }
.logo { color: #ff7a45; font-weight: 700; }
.burger { display: none; background: none; border: none; color: #eee8d8; font-size: 20px; }

@media (max-width: 640px) {
  .burger { display: block; }
  .links { display: none; }
  .links.open { display: flex; flex-direction: column; position: absolute; top: 52px; left: 0; right: 0; background: #151610; padding: 16px; }
}`,
      js: `document.querySelector('.burger').addEventListener('click', () => {
  document.querySelector('.links').classList.toggle('open');
});`,
    },
    completionCriteria: [],
  }),
  p('Pricing Card', 'pricing-card', '💳', 'intermediate', {
    description: 'Two-tier pricing card with a highlighted Pro plan.',
    objectives: ['Build a pricing layout', 'Highlight one plan', 'Use custom properties for theming'],
    requirements: ['Two plans side by side', 'Pro plan has accent border/badge', 'Feature list formatted', 'Prices display with intervals'],
    estimatedMinutes: 40,
    order: 4,
    starterFiles: {
      html: '<div class="pricing"><div class="plan"><h2>Free</h2><p class="price">$0<span>/mo</span></p><ul><li>Core lessons</li><li>Playground</li></ul></div><div class="plan pro"><span class="badge">Best value</span><h2>Pro</h2><p class="price">$9<span>/mo</span></p><ul><li>Everything</li><li>AI tutor</li><li>Pro projects</li></ul></div></div>',
      css: reset + `
body { display: grid; place-items: center; min-height: 100vh; }

.pricing { display: flex; gap: 20px; }

.plan {
  padding: 24px;
  background: #151610;
  border: 1px solid #302d25;
  border-radius: 16px;
  min-width: 200px;
}

.pro {
  border-color: #ff7a45;
  position: relative;
}

.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff7a45;
  color: #0d0e09;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: .75rem;
}

.price { font-size: 2rem; color: #ff7a45; margin: 8px 0 16px; }
.price span { font-size: .9rem; color: #9b9687; }`,
    },
    completionCriteria: [],
  }),
  p('Login Form', 'login-form', '🔑', 'beginner', {
    description: 'Accessible login form with floating labels and input focus states.',
    objectives: ['Label correctly', 'Focus styles for keyboard users', 'Validation hint styling'],
    requirements: ['Email + password inputs with labels', 'Visible focus rings', 'Submit button opens reload', 'Trim button state'],
    estimatedMinutes: 30,
    order: 5,
    starterFiles: {
      html: '<form class="login"><h2>Welcome back</h2><label for="email">Email<input id="email" type="email" required /></label><label for="password">Password<input id="password" type="password" required /></label><button type="submit">Sign in</button></form>',
      css: reset + `
body { display: grid; place-items: center; min-height: 100vh; }

.login { display: grid; gap: 16px; width: min(360px, 90vw); }
.login label { display: grid; gap: 6px; font-size: .85rem; color: #9b9687; }
.login input {
  padding: 10px 12px;
  background: #1b1a15;
  border: 1px solid #302d25;
  border-radius: 8px;
  color: #eee8d8;
}
.login input:focus { outline: 2px solid #ff7a45; outline-offset: 1px; }
.login button {
  padding: 12px; border: none; border-radius: 10px;
  background: #ff7a45; color: #0d0e09; cursor: pointer;
}`,
    },
    completionCriteria: [],
  }),
  p('SaaS Dashboard Shell', 'saas-dashboard-shell', '📊', 'advanced', {
    description: 'A dashboard shell: sidebar, topbar, stats row and content cards using CSS Grid.',
    objectives: ['Build a CSS grid app shell', 'Responsive sidebar behavior', 'Stats row with cards'],
    requirements: ['Sidebar on desktop, collapsed on mobile', 'Topbar sticky at top', 'Stat cards in responsive grid', 'Content area uses card backgrounds'],
    estimatedMinutes: 60,
    order: 6,
    starterFiles: {
      html: '<div class="shell"><aside class="sidebar"><a href="#">Home</a><a href="#">Analytics</a><a href="#">Settings</a></aside><div class="main"><header class="topbar">Dashboard</header><div class="stats"><div class="card">Active users<br><strong>1,284</strong></div><div class="card">Revenue<br><strong>$12.4k</strong></div><div class="card">Churn<br><strong>2.1%</strong></div></div></div></div>',
      css: reset + `
body { margin: 0; min-height: 100vh; }

.shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
.sidebar { background: #151610; padding: 20px; border-right: 1px solid #302d25; display: flex; flex-direction: column; gap: 12px; }
.sidebar a { color: #9b9687; text-decoration: none; padding: 8px 12px; border-radius: 8px; }
.sidebar a:first-child { color: #ff7a45; } /* active indicator */

.main { display: flex; flex-direction: column; }
.topbar { position: sticky; top: 0; background: #0d0e09; padding: 16px 24px; border-bottom: 1px solid #302d25; font-weight: 600; }

.stats { padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.card { background: #1b1a15; border: 1px solid #302d25; border-radius: 12px; padding: 16px; color: #9b9687; }
.card strong { color: #eee8d8; font-size: 1.4rem; }

@media (max-width: 720px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { flex-direction: row; justify-content: center; border-right: none; border-bottom: 1px solid #302d25; }
}`,
    },
    completionCriteria: [],
  }),

  p('Responsive Portfolio Section', 'responsive-portfolio', '💼', 'beginner', {
    description: 'Hero + work section you would find on a personal portfolio.',
    objectives: ['Design a hero with type hierarchy', 'Responsive grid of paper cards', 'Hover interactions'],
    requirements: ['Hero headline with clamp() sizes', 'Projects grid of ≥3 cards', 'Grid reflows to single column on mobile'],
    estimatedMinutes: 45,
    order: 7,
    starterFiles: {
      html: '<section class="hero"><h1>Made with CSS</h1><p>Three quick experiments.</p></section><section class="work"><a class="tile">Card A</a><a class="tile">Card B</a><a class="tile">Card C</a></section>',
      css: reset + `
.hero { padding: clamp(24px, 8vw, 96px); text-align: center; }
.hero h1 { font-size: clamp(2rem, 6vw, 4rem); margin: 0; color: #ff7a45; }

.work { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 24px; }
.tile { background: #1b1a15; border: 1px solid #302d25; border-radius: 12px; padding: 40px 16px; text-align: center; color: #eee8d8; transition: transform .2s, border-color .2s; }
.tile:hover { transform: translateY(-4px); border-color: #ff7a45; }`,
    },
  }),
  p('Product Card Grid', 'product-card-grid', '🛒', 'intermediate', {
    description: 'E-commerce product tiles with badges, ratings and add-to-cart buttons.',
    objectives: ['Design a card kit', 'Overlay a badge absolutely', 'Style a CTA row with hover'],
    requirements: ['Grid of 3+ products', 'Promo badge on one item', 'CTA button hover state', 'Rating stars visible'],
    estimatedMinutes: 45,
    order: 8,
    starterFiles: {
      html: '<div class="grid"><div class="product"><span class="badge">-20%</span><h2>Aurora Kit</h2><p>★★★★☆</p><button>Add to cart — $24</button></div><div class="product"><h2>Nova Card</h2><p>★★★★★</p><button>Add to cart — $18</button></div></div>',
      css: reset + `
body { padding: 24px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }

.product { position: relative; background: #1b1a15; border: 1px solid #302d25; border-radius: 12px; padding: 20px; }
.badge { position: absolute; top: 12px; right: 12px; background: #e5484d; color: #fff; padding: 2px 8px; font-size: .75rem; border-radius: 999px; }
.product button { width: 100%; padding: 10px; background: #ff7a45; border: none; border-radius: 8px; cursor: pointer; color: #0d0e09; }
.product button:hover { background: #ff8d61; }`,
    },
  }),
  p('Pricing Comparison Table', 'pricing-comparison', '📋', 'advanced', {
    description: 'Feature-comparison table with a highlighted column.',
    objectives: ['Semantic table layout', 'Column highlighting via nth-child', 'Responsive horizontal scroll'],
    requirements: ['Table with header row', 'Pro column highlighted', 'Checkmarks for included features'],
    estimatedMinutes: 45,
    order: 9,
    starterFiles: {
      html: '<table><thead><th></th><th>Free</th><th class="hl">Pro</th></thead><tbody><tr><td>Lessons</td><td>✅</td><td>✅</td></tr><tr><td>AI tutor</td><td>—</td><td>✅</td></tr></tbody></table>',
      css: reset + `
body { padding: 24px; }
table { border-collapse: collapse; width: 100%; max-width: 640px; margin: auto; }
th, td { padding: 12px 16px; border: 1px solid #302d25; text-align: center; }
.hl { background: #ff7a45; color: #0d0e09; font-weight: 700; }
tr td:nth-child(3) { background: rgba(255, 122, 69, .08); }`,
    },
  }),
  p('Dashboard Layout', 'dashboard-layout', '🎛️', 'advanced', {
    description: 'A widget dashboard using named grid areas and responsive reordering.',
    objectives: ['Grid areas without div soup', 'Responsive area reflow', 'Consistent widgets'],
    requirements: ['Named grid areas for header/sidebar/main', 'Collapses to single column on mobile', 'Consistent card style'],
    estimatedMinutes: 60,
    order: 10,
    starterFiles: {
      html: '<div class="board"><header>H</header><aside>S</aside><main>M</main></div>',
      css: reset + `
body { margin: 0; min-height: 100vh; }
.board {
  display: grid;
  grid-template: "side main" 1fr / 220px 1fr;
  min-height: 100vh;
}
header { background: #151610; padding: 16px; }
aside { background: #17160f; padding: 16px; }
main { background: #0d0e09; padding: 16px; }
@media (max-width: 720px) {
  .board { grid-template: "side" "main" auto / 1fr; }
}`,
    },
  }),
  p('Animated Hero Section', 'animated-hero', '🎬', 'intermediate', {
    description: 'A landing hero with staggered entrance animation and gradient buttons.',
    objectives: ['Compose a hero', 'Animate entrance with keyframes', 'Stagger delays'],
    requirements: ['Hero copy + CTA + background', 'Entrance animation on load', 'Respects reduced motion'],
    estimatedMinutes: 45,
    order: 11,
    starterFiles: {
      html: '<section class="hero"><h1>CSS you can see.</h1><a class="cta">Start Learning</a></section>',
      css: reset + `
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}

.hero { text-align: center; padding: 96px 24px; }
.hero h1 { font-size: 3rem; animation: rise .6s ease both; }
.cta { display: inline-block; margin-top: 16px; padding: 14px 28px; background: #ff7a45; color: #0d0e09; border-radius: 12px; text-decoration: none; animation: rise .6s .2s ease both; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}`,
    },
  }),
  p('Responsive Photo Gallery', 'photo-gallery', '🖼️', 'intermediate', {
    description: 'Masonry-ish responsive photo grid with captions on hover.',
    objectives: ['auto-fill grid technique', 'Hover overlay for captions', 'Responsive aspect ratios'],
    requirements: ['Grid reflows at multiple breakpoints', 'Hover caption overlay', 'No layout shift'],
    estimatedMinutes: 45,
    order: 12,
    starterFiles: {
      html: '<div class="gallery"><figure><img src="https://picsum.photos/300/180" alt="Photo one"/><figcaption>One</figcaption></figure><figure><img src="https://picsum.photos/300/240" alt="Photo two"/><figcaption>Two</figcaption></figure><figure><img src="https://picsum.photos/300/200" alt="Photo three"/><figcaption>Three</figcaption></figure></div>',
      css: reset + `
body { padding: 24px; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
figure { position: relative; margin: 0; overflow: hidden; border-radius: 10px; }
img { width: 100%; display: block; aspect-ratio: 3/2; object-fit: cover; }
figcaption { position: absolute; inset: auto 0 0 0; background: linear-gradient(transparent, rgba(0,0,0,.7)); padding: 24px 12px 8px; color: #fff; opacity: 0; transition: opacity .2s; }
figure:hover figcaption { opacity: 1; }`,
    },
  }),
  p('CSS-only Tooltip Collection', 'tooltip-collection', '💬', 'advanced', {
    description: 'Pure-CSS tooltips with no JavaScript, in four directions.',
    objectives: ['Hover pseudo-elements', 'Position tooltips absolutely', 'Arrow tricks with borders'],
    requirements: ['Tooltips on hover for each button', 'At least 2 distinct directions', 'No JavaScript used'],
    estimatedMinutes: 40,
    order: 13,
    starterFiles: {
      html: '<button data-tip="Top tooltip">Top</button><button data-tip="Bottom tooltip">Bottom</button>',
      css: reset + `
body { display: grid; place-items: center; min-height: 80vh; gap: 12px; }
button { position: relative; padding: 10px 16px; background: #21201a; color: #eee8d8; border: 1px solid #302d25; border-radius: 8px; }

button::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #ff7a45; color: #0d0e09;
  padding: 4px 10px; border-radius: 6px; font-size: .8rem;
  opacity: 0; pointer-events: none; transition: opacity .15s;
  white-space: nowrap;
}
button:hover::after { opacity: 1; }`,
    },
  }),
  p('Loading Animation Collection', 'loading-animations', '⏳', 'intermediate', {
    description: 'Three spinners: bar wave, dots and skeleton shimmer.',
    objectives: ['Infinite keyframes', 'Delay staggering', 'Skeleton shimmer technique'],
    requirements: ['At least 3 different loaders', 'Animations run infinitely without user input', 'All use transform/opacity only'],
    estimatedMinutes: 45,
    order: 14,
    starterFiles: {
      html: '<div class="row"><div class="bar"><span></span><span></span><span></span></div><div class="dot-ring"></div><div class="skeleton"></div></div>',
      css: reset + `
body { display: grid; place-items: center; min-height: 100vh; }
.row { display: flex; gap: 48px; align-items: center; }

@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.bar { display: flex; gap: 4px; }
.bar span { width: 6px; height: 20px; background: #ff7a45; border-radius: 3px; animation: bounce .8s ease-in-out infinite; }
.bar span:nth-child(2) { animation-delay: .15s; }
.bar span:nth-child(3) { animation-delay: .3s; }

@keyframes ring { to { transform: rotate(360deg); } }
.dot-ring { width: 26px; height: 26px; border: 3px solid #302d25; border-top-color: #ff7a45; border-radius: 50%; animation: ring .9s linear infinite; }

@keyframes shimmer { to { background-position: 200% 0; } }
.skeleton { width: 120px; height: 14px; border-radius: 8px; background: linear-gradient(90deg, #21201a 25%, #302d25 50%, #21201a 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }`,
    },
  }),
];

export const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
