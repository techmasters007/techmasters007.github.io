/**
 * Generates one HTML redirect page per topic inside /topics/.
 * Each page carries full Open Graph meta tags so WhatsApp, Telegram,
 * Slack etc. render a rich link preview. The page then immediately
 * redirects the actual visitor to the SPA (index.html#type/id).
 *
 * Usage:
 *   node generate-topics.js
 *
 * Run this once after adding or editing topics in data.js.
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
// Set this to the URL where the site is publicly hosted.
// For GitHub Pages it is typically: https://<username>.github.io
const BASE_URL = 'https://techmasters007.github.io';
// ─────────────────────────────────────────────────────────────────────────────

// Load data.js in Node without modifying it
const dataSource = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf-8');
eval(dataSource.replace(/^\s*const\s+DATA\s*=/, 'var DATA ='));

const TOPICS_DIR = path.join(__dirname, 'topics');
if (!fs.existsSync(TOPICS_DIR)) fs.mkdirSync(TOPICS_DIR);

const IMAGE_URL = `${BASE_URL}/og-image.svg`;

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildDescription(topic) {
  const cos = topic.companies.slice(0, 5).join(', ');
  const tgs = topic.tags.slice(0, 4).join(' · ');
  const q   = topic.expectedQuestions ? topic.expectedQuestions[0] : '';
  return esc(`Asked at ${cos}. Topics: ${tgs}. ${q}`);
}

function generateHtml(type, topic) {
  const pageUrl    = `${BASE_URL}/topics/${type}-${topic.id}.html`;
  const spaUrl     = `${BASE_URL}/index.html#${type}/${topic.id}`;
  const spaRelUrl  = `../index.html#${type}/${topic.id}`;
  const title      = esc(`${topic.title} — TechMaster`);
  const desc       = buildDescription(topic);
  const difficulty = esc(topic.difficulty);
  const companies  = esc(topic.companies.join(', '));
  const category   = type === 'system-design' ? 'System Design' : 'DSA';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">

  <!-- Open Graph (WhatsApp, Facebook, Slack, LinkedIn) -->
  <meta property="og:type"        content="article">
  <meta property="og:site_name"   content="TechMaster Knowledge Base">
  <meta property="og:title"       content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image"       content="${IMAGE_URL}">
  <meta property="og:image:type"  content="image/svg+xml">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url"         content="${pageUrl}">

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image"       content="${IMAGE_URL}">

  <!-- Extra meta for rich previews -->
  <meta name="keywords"   content="${esc(topic.tags.join(', '))}, ${category}, interview prep, TechMaster">
  <meta name="author"     content="TechMaster">
  <meta name="difficulty" content="${difficulty}">
  <meta name="companies"  content="${companies}">

  <link rel="canonical" href="${spaUrl}">

  <!-- Redirect visitor to the SPA immediately -->
  <meta http-equiv="refresh" content="0;url=${spaRelUrl}">

  <style>
    body { margin:0; background:#0d0c18; color:#94a3b8;
           font-family:system-ui,sans-serif; display:flex;
           align-items:center; justify-content:center; height:100vh; }
    .box { text-align:center; }
    .box h1 { color:#e2e8f0; font-size:22px; margin-bottom:8px; }
    .box p  { font-size:14px; }
    .box a  { color:#a78bfa; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${esc(topic.title)}</h1>
    <p>Redirecting… <a href="${spaRelUrl}">click here if not redirected</a></p>
  </div>
  <script>window.location.replace('${spaRelUrl}');</script>
</body>
</html>`;
}

let count = 0;

DATA.systemDesign.forEach(topic => {
  const file = `system-design-${topic.id}.html`;
  fs.writeFileSync(path.join(TOPICS_DIR, file), generateHtml('system-design', topic));
  console.log(`  ✓  topics/${file}`);
  count++;
});

DATA.dsa.forEach(topic => {
  const file = `dsa-${topic.id}.html`;
  fs.writeFileSync(path.join(TOPICS_DIR, file), generateHtml('dsa', topic));
  console.log(`  ✓  topics/${file}`);
  count++;
});

console.log(`\nGenerated ${count} topic pages in /topics/\n`);
console.log('Share URL format:');
console.log(`  ${BASE_URL}/topics/system-design-url-shortener.html`);
console.log(`  ${BASE_URL}/topics/dsa-dynamic-programming.html`);
console.log('\nRemember: WhatsApp previews only work on publicly hosted URLs.');
