
const params = new URLSearchParams(window.location.search);

async function getArticles() {
  const res = await fetch('data/articles.json', { cache: 'no-store' });
  return (await res.json()).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

function label(category) {
  return String(category || '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function adBlock(kind = 'inline') {
  const labels = {
    inline: 'Advertisement',
    article: 'Article sponsor',
    print: 'Print sponsor'
  };
  return `<aside class="content-ad content-ad-${kind}" aria-label="${labels[kind] || 'Advertisement'}">
    <span>${labels[kind] || 'Advertisement'}</span>
    <strong>Promote your local business with Witney Wire</strong>
    <p>Clean, clearly labelled advertising space designed to protect the reading experience.</p>
    <a href="advertise.html">Book this space</a>
  </aside>`;
}

function renderArticleBody(body = []) {
  const paragraphs = Array.isArray(body) ? body : [body];

  return paragraphs
    .filter(Boolean)
    .map(text => `<p>${text}</p>`)
    .join('');
}

function card(article) {
  return `<a class="story-card" href="article.html?id=${encodeURIComponent(article.id)}">
    <img src="${article.image}" alt="">
    <div class="story-body">
      <span class="label">${label(article.category)}</span>
      <h3>${article.title}</h3>
      <p>${article.summary}</p>
      <div class="meta">${formatDate(article.date)} · ${article.author}</div>
    </div>
  </a>`;
}

async function initHome() {
  const top = document.querySelector('#top-stories');
  if (!top) return;

  const articles = await getArticles();
  const lead = articles[0];
  top.innerHTML = `<a class="lead-card" href="article.html?id=${encodeURIComponent(lead.id)}">
    <div>
      <span class="label">${label(lead.category)}</span>
      <h2>${lead.title}</h2>
      <p>${lead.summary}</p>
      <div class="meta">${formatDate(lead.date)} · ${lead.author}</div>
    </div>
    <img src="${lead.image}" alt="">
  </a>`;

  const latest = document.querySelector('#latest-list');
  if (latest) {
    latest.innerHTML = articles.slice(1, 5).map(a => `<a class="latest-item" href="article.html?id=${encodeURIComponent(a.id)}">${a.title}</a>`).join('');
  }

  const more = document.querySelector('#more-stories');
  if (more) {
    more.innerHTML = articles.slice(1).map(card).join('');
  }
}

async function initCategory() {
  const holder = document.querySelector('#category-stories');
  if (!holder) return;

  const category = params.get('category') || 'news';
  document.querySelector('#category-title').textContent = label(category);
  const articles = (await getArticles()).filter(a => a.category === category);
  holder.innerHTML = articles.length ? articles.map(card).join('') : '<p>No stories in this section yet.</p>';
}

async function initArticle() {
  const view = document.querySelector('#article-view');
  if (!view) return;

  const id = params.get('id');
  const article = (await getArticles()).find(a => a.id === id);
  if (!article) {
    view.innerHTML = '<h1>Story not found</h1><p>Please return to the homepage.</p>';
    return;
  }

  document.title = `${article.title} | Witney Wire`;
  view.innerHTML = `
    <span class="label">${label(article.category)}</span>
    <h1>${article.title}</h1>
    <p class="article-summary">${article.summary}</p>
    <div class="meta">${formatDate(article.date)} · ${article.author}</div>
    <img class="article-hero" src="${article.image}" alt="">
    <p class="ai-disclaimer">The image used with this story is an AI-generated illustration of Witney town centre in hot weather.</p>
    ${adBlock('article')}
    <div class="article-body">${renderArticleBody(article.body)}</div>
    ${adBlock('article')}
  `;
}

initHome();
initCategory();
initArticle();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}