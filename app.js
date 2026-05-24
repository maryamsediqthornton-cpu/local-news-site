
// ARTICLE PAGE IMAGE + AD LAYOUT UPDATE

function renderArticlePage(article) {
  return `
    <article class="ww-article-page">
      <div class="ww-article-category">${article.category || ''}</div>

      <h1 class="ww-article-title">${article.title || ''}</h1>

      <p class="ww-article-standfirst">
        ${article.summary || ''}
      </p>

      <div class="ww-article-meta">
        ${article.date || ''} · ${article.author || 'Witney Wire'}
      </div>

      <div class="ww-article-image-wrap">
        <img class="ww-article-image" src="${article.image || ''}" alt="${article.title || ''}">
      </div>

      <!-- TOP ARTICLE AD -->
      <div class="ww-inline-article-ad">
        <div class="ww-ad-label">Advertisement</div>
        <img src="https://placehold.co/970x90/002147/ffffff?text=Advertise+with+Witney+Wire" alt="Advertisement">
      </div>

      <div class="ww-article-body">
        ${(article.body || []).map((paragraph, index) => `
          <p>${paragraph}</p>

          ${index === 2 ? `
          <div class="ww-inline-article-ad">
            <div class="ww-ad-label">Advertisement</div>
            <img src="https://placehold.co/970x90/0b5d3b/ffffff?text=Support+Local+Business" alt="Advertisement">
          </div>
          ` : ''}
        `).join('')}
      </div>
    </article>
  `;
}
