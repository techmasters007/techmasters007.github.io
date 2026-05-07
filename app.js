// ── Share URL helper ─────────────────────────────────────────────────────────
// Returns the /topics/ redirect page URL (carries OG tags for WhatsApp previews).
// Works both locally (file://) and when deployed to GitHub Pages.
function getTopicShareUrl(type, id) {
  const base = window.location.href.split('index.html')[0].split('#')[0];
  return `${base}topics/${type}-${id}.html`;
}

// ── Router ────────────────────────────────────────────────────────────────────

function getRoute() {
  const hash = window.location.hash.replace('#', '') || '';
  const parts = hash.split('/').filter(Boolean);
  return { section: parts[0] || 'home', id: parts[1] || null };
}

function navigate(path) {
  window.location.hash = path;
}

// ── Templates ─────────────────────────────────────────────────────────────────

function difficultyBadge(d) {
  const cls = { Easy: 'easy', Medium: 'medium', Hard: 'hard' }[d] || 'easy';
  return `<span class="badge badge-${cls}">${d}</span>`;
}

function companyTags(companies) {
  return companies.map(c => `<span class="tag">${c}</span>`).join('');
}

function topicTags(tags) {
  return tags.map(t => `<span class="tag tag-outline">${t}</span>`).join('');
}

function renderHome() {
  return `
    <section class="home">
      <div class="home-hero">
        <div class="hero-badge">Knowledge Base</div>
        <h1 class="hero-title">Tech<span class="accent">Master</span></h1>
        <p class="hero-sub">Your go-to resource for DSA and System Design interview prep.<br>Pick a topic, study, and share the link with your fellow participants.</p>
      </div>

      <div class="category-grid">
        <div class="category-card sd-card" onclick="navigate('system-design')">
          <div class="cat-icon sd-icon">
            <i class="fa-solid fa-sitemap"></i>
          </div>
          <div class="cat-info">
            <h2>System Design</h2>
            <p>${DATA.systemDesign.length} topics — URL shortener, distributed systems, real-time apps, and more.</p>
            <div class="cat-meta">
              <span><i class="fa-solid fa-layer-group"></i> Architecture</span>
              <span><i class="fa-solid fa-scale-balanced"></i> Trade-offs</span>
              <span><i class="fa-solid fa-building"></i> Companies</span>
            </div>
          </div>
          <i class="fa-solid fa-arrow-right cat-arrow"></i>
        </div>

        <div class="category-card dsa-card" onclick="navigate('dsa')">
          <div class="cat-icon dsa-icon">
            <i class="fa-solid fa-code"></i>
          </div>
          <div class="cat-info">
            <h2>DSA</h2>
            <p>${DATA.dsa.length} topics — arrays, graphs, dynamic programming, trees, and more.</p>
            <div class="cat-meta">
              <span><i class="fa-solid fa-stopwatch"></i> Complexity</span>
              <span><i class="fa-solid fa-lightbulb"></i> Patterns</span>
              <span><i class="fa-solid fa-terminal"></i> Problems</span>
            </div>
          </div>
          <i class="fa-solid fa-arrow-right cat-arrow"></i>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">${DATA.systemDesign.length + DATA.dsa.length}</span>
          <span class="stat-label">Total Topics</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">${DATA.systemDesign.reduce((a, t) => a + t.companies.length, 0) + DATA.dsa.reduce((a, t) => a + t.companies.length, 0)}</span>
          <span class="stat-label">Company Data Points</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">${DATA.dsa.reduce((a, t) => a + t.problems.length, 0)}</span>
          <span class="stat-label">Practice Problems</span>
        </div>
      </div>
    </section>
  `;
}

function renderCategory(type) {
  const topics = type === 'system-design' ? DATA.systemDesign : DATA.dsa;
  const label = type === 'system-design' ? 'System Design' : 'DSA';
  const colorClass = type === 'system-design' ? 'sd' : 'dsa';
  const icon = type === 'system-design' ? 'fa-sitemap' : 'fa-code';

  const cards = topics.map(t => `
    <div class="topic-card ${colorClass}-card-sm" onclick="navigate('${type}/${t.id}')">
      <div class="tc-header">
        <div>
          <h3>${t.title}</h3>
          ${t.subtitle ? `<p class="tc-subtitle">${t.subtitle}</p>` : ''}
        </div>
        ${difficultyBadge(t.difficulty)}
      </div>
      <div class="tc-companies">${companyTags(t.companies.slice(0, 4))}${t.companies.length > 4 ? `<span class="tag-more">+${t.companies.length - 4}</span>` : ''}</div>
      <div class="tc-tags">${topicTags(t.tags.slice(0, 3))}</div>
      <div class="tc-footer">
        <span class="tc-link">View topic <i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </div>
  `).join('');

  return `
    <section class="category-page">
      <div class="page-header">
        <button class="back-btn" onclick="navigate('home')">
          <i class="fa-solid fa-arrow-left"></i> Home
        </button>
        <div class="page-title-wrap">
          <div class="page-icon ${colorClass}-icon"><i class="fa-solid ${icon}"></i></div>
          <h1>${label}</h1>
        </div>
        <p class="page-desc">${topics.length} topics with company data, expected questions, and detailed approaches.</p>
      </div>

      <div class="search-bar-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          type="text"
          id="topic-search"
          class="search-bar"
          placeholder="Search topics..."
          oninput="filterTopics(this.value, '${type}')"
        />
      </div>

      <div class="topics-grid" id="topics-grid">
        ${cards}
      </div>
      <p id="no-results" class="no-results hidden">No topics match your search.</p>
    </section>
  `;
}

function renderTopic(type, id) {
  const topics = type === 'system-design' ? DATA.systemDesign : DATA.dsa;
  const topic = topics.find(t => t.id === id);
  if (!topic) return `<div class="error-page"><h2>Topic not found.</h2><button onclick="navigate('${type}')">Back</button></div>`;

  const colorClass = type === 'system-design' ? 'sd' : 'dsa';
  const categoryLabel = type === 'system-design' ? 'System Design' : 'DSA';

  const shareUrl = getTopicShareUrl(type, id);

  const questionsHtml = topic.expectedQuestions.map(q => `<li>${q}</li>`).join('');

  const componentsHtml = (type === 'system-design' ? topic.keyComponents : [])
    .map(c => `
      <div class="component-card">
        <div class="comp-name">${c.name}</div>
        <div class="comp-desc">${c.description}</div>
      </div>
    `).join('');

  const stepsHtml = type === 'system-design'
    ? topic.designSteps.map((s, i) => `
        <div class="step-item">
          <div class="step-num">${i + 1}</div>
          <div class="step-text">${s}</div>
        </div>
      `).join('')
    : '';

  const tradeoffsHtml = type === 'system-design'
    ? `<div class="tradeoffs-grid">
        ${topic.tradeoffs.map(t => `
          <div class="tradeoff-card">
            <div class="tradeoff-aspect">${t.aspect}</div>
            <div class="tradeoff-row">
              <div class="tradeoff-pro"><i class="fa-solid fa-circle-check"></i> ${t.pro}</div>
              <div class="tradeoff-con"><i class="fa-solid fa-circle-xmark"></i> ${t.con}</div>
            </div>
          </div>
        `).join('')}
      </div>`
    : '';

  const followUpsHtml = type === 'system-design'
    ? `<section class="topic-section">
        <h2><i class="fa-solid fa-comments"></i> Follow-up Questions</h2>
        <ul class="followups-list">
          ${topic.followUps.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </section>`
    : '';

  // DSA-specific sections
  const dsaProblemsHtml = type === 'dsa'
    ? `<section class="topic-section">
        <h2><i class="fa-solid fa-list-check"></i> Practice Problems</h2>
        <div class="problems-table">
          <div class="pt-header">
            <span>Problem</span>
            <span>Difficulty</span>
            <span>Key Insight</span>
          </div>
          ${topic.problems.map(p => `
            <div class="pt-row">
              <span class="pt-name">${p.name}</span>
              <span>${difficultyBadge(p.difficulty)}</span>
              <span class="pt-note">${p.note}</span>
            </div>
          `).join('')}
        </div>
      </section>`
    : '';

  const dsaMetaHtml = type === 'dsa'
    ? `<div class="complexity-row">
        <div class="complexity-card">
          <div class="cx-label"><i class="fa-solid fa-clock"></i> Time Complexity</div>
          <div class="cx-value">${topic.timeComplexity}</div>
        </div>
        <div class="complexity-card">
          <div class="cx-label"><i class="fa-solid fa-memory"></i> Space Complexity</div>
          <div class="cx-value">${topic.spaceComplexity}</div>
        </div>
      </div>`
    : '';

  const insightsHtml = type === 'dsa'
    ? `<section class="topic-section">
        <h2><i class="fa-solid fa-lightbulb"></i> Key Insights</h2>
        <ul class="insights-list">
          ${topic.keyInsights.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </section>`
    : '';

  const mistakesHtml = type === 'dsa'
    ? `<section class="topic-section">
        <h2><i class="fa-solid fa-triangle-exclamation"></i> Common Mistakes</h2>
        <ul class="mistakes-list">
          ${topic.commonMistakes.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </section>`
    : '';

  return `
    <section class="topic-page">
      <div class="topic-nav">
        <button class="back-btn" onclick="navigate('${type}')">
          <i class="fa-solid fa-arrow-left"></i> ${categoryLabel}
        </button>
        <button class="share-btn" onclick="copyLink('${shareUrl}')">
          <i class="fa-solid fa-link"></i> <span id="share-btn-text">Copy Link</span>
        </button>
      </div>

      <div class="topic-header ${colorClass}-header">
        <div class="th-meta">
          ${difficultyBadge(topic.difficulty)}
          ${type === 'dsa' ? `<span class="pattern-badge">${topic.pattern}</span>` : ''}
        </div>
        <h1>${topic.title}</h1>
        ${topic.subtitle ? `<p class="th-subtitle">${topic.subtitle}</p>` : ''}
        <div class="th-tags">${topicTags(topic.tags)}</div>
      </div>

      <section class="topic-section">
        <h2><i class="fa-solid fa-circle-info"></i> Overview</h2>
        <p class="overview-text">${topic.overview}</p>
      </section>

      <section class="topic-section">
        <h2><i class="fa-solid fa-building"></i> Companies That Ask This</h2>
        <div class="company-tags">${companyTags(topic.companies)}</div>
      </section>

      <section class="topic-section">
        <h2><i class="fa-solid fa-question-circle"></i> Expected Interview Questions</h2>
        <ul class="questions-list">
          ${questionsHtml}
        </ul>
      </section>

      ${type === 'system-design' ? `
        <section class="topic-section">
          <h2><i class="fa-solid fa-cubes"></i> Key Components</h2>
          <div class="components-grid">
            ${componentsHtml}
          </div>
        </section>

        <section class="topic-section">
          <h2><i class="fa-solid fa-stairs"></i> Design Steps</h2>
          <div class="steps-list">
            ${stepsHtml}
          </div>
        </section>

        <section class="topic-section">
          <h2><i class="fa-solid fa-scale-balanced"></i> Key Trade-offs</h2>
          ${tradeoffsHtml}
        </section>
      ` : ''}

      ${type === 'dsa' ? `
        <section class="topic-section">
          <h2><i class="fa-solid fa-code"></i> Approach & Templates</h2>
          <pre class="code-block">${escapeHtml(topic.approach.trim())}</pre>
        </section>
        ${dsaMetaHtml}
      ` : ''}

      ${dsaProblemsHtml}
      ${insightsHtml}
      ${mistakesHtml}
      ${followUpsHtml}

      <div class="topic-share-footer">
        <p>Share this topic with your participants:</p>
        <div class="share-url-box">
          <span class="share-url-text" id="share-url-display">${shareUrl}</span>
          <button class="copy-url-btn" onclick="copyLink('${shareUrl}')">
            <i class="fa-solid fa-copy"></i> Copy
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderNav() {
  const { section } = getRoute();
  const isHome = section === 'home';
  document.getElementById('navbar').innerHTML = `
    <div class="nav-inner">
      <div class="nav-logo" onclick="navigate('home')">
        <i class="fa-solid fa-rocket"></i>
        <span>TechMaster</span>
      </div>
      <nav class="nav-links">
        <a onclick="navigate('home')" class="${isHome ? 'active' : ''}">Home</a>
        <a onclick="navigate('system-design')" class="${section === 'system-design' ? 'active' : ''}">
          <i class="fa-solid fa-sitemap"></i> System Design
        </a>
        <a onclick="navigate('dsa')" class="${section === 'dsa' ? 'active' : ''}">
          <i class="fa-solid fa-code"></i> DSA
        </a>
      </nav>
    </div>
  `;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('share-btn-text');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
    }
  });
}

function filterTopics(query, type) {
  const topics = type === 'system-design' ? DATA.systemDesign : DATA.dsa;
  const grid = document.getElementById('topics-grid');
  const noResults = document.getElementById('no-results');
  const q = query.toLowerCase().trim();

  if (!q) {
    grid.querySelectorAll('.topic-card').forEach(c => c.style.display = '');
    noResults.classList.add('hidden');
    return;
  }

  let visible = 0;
  grid.querySelectorAll('.topic-card').forEach((card, i) => {
    const t = topics[i];
    const match = t.title.toLowerCase().includes(q)
      || t.tags.some(tag => tag.toLowerCase().includes(q))
      || t.companies.some(c => c.toLowerCase().includes(q))
      || (t.subtitle && t.subtitle.toLowerCase().includes(q));
    card.style.display = match ? '' : 'none';
    if (match) visible++;
  });

  noResults.classList.toggle('hidden', visible > 0);
}

// ── Main render ───────────────────────────────────────────────────────────────

function render() {
  const { section, id } = getRoute();
  const app = document.getElementById('app');

  if (section === 'home' || !section) {
    app.innerHTML = renderHome();
  } else if (section === 'system-design' && !id) {
    app.innerHTML = renderCategory('system-design');
  } else if (section === 'system-design' && id) {
    app.innerHTML = renderTopic('system-design', id);
  } else if (section === 'dsa' && !id) {
    app.innerHTML = renderCategory('dsa');
  } else if (section === 'dsa' && id) {
    app.innerHTML = renderTopic('dsa', id);
  } else {
    app.innerHTML = renderHome();
  }

  renderNav();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', render);
window.addEventListener('load', render);
