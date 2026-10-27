
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

function authorProfile(article) {
  const category = String(article.category || '').toLowerCase();

  if (category === 'sport') {
    return {
      name: 'Mark',
      role: 'Sports Journalist',
      image: 'assets/mark-author.png'
    };
  }

  if (category === 'business') {
    return {
      name: 'Robert',
      role: 'Business Journalist',
      image: 'assets/robert-author.png'
    };
  }

  return {
    name: 'Mary',
    role: 'Journalist',
    image: 'assets/maryam-author.jpg'
  };
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


function haveYourSayBlock() {
  return `<section class="have-your-say" aria-label="Have your say">
    <h2>Have Your Say</h2>
    <p>What do you think about this story?</p>
    <p>Email your views to <a href="mailto:contact@witneywire.co.uk">contact@witneywire.co.uk</a>.</p>
    <small>Please include the article headline in your email. Letters may be edited for length, clarity and legal reasons.</small>
  </section>`;
}

function renderArticleBody(body = []) {
  const blocks = Array.isArray(body) ? body : [body];

  return blocks
    .filter(Boolean)
    .map(block => {
      if (typeof block === 'object') {
        if (block.type === 'heading') {
          return `<h2>${block.text || ''}</h2>`;
        }

        if (block.type === 'image') {
          return `<figure class="article-inline-figure">
            <img src="${block.src || ''}" alt="${block.alt || ''}">
            ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
          </figure>`;
        }
      }

      return `<p>${block}</p>`;
    })
    .join('');
}

function card(article) {
  return `<a class="story-card" href="article?id=${encodeURIComponent(article.id)}">
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

  const articles = (await getArticles()).filter(article => article.excludeFromHomepage !== true);
  const lead = articles[0];
  const secondary = articles[1];

  top.innerHTML = [lead, secondary].filter(Boolean).map((article, index) => `
    <a class="lead-card${index === 1 ? ' secondary-story' : ''}" href="article?id=${encodeURIComponent(article.id)}">
      <div>
        <span class="label">${label(article.category)}</span>
        <h2>${article.title}</h2>
        <p>${article.summary}</p>
        <div class="meta">${formatDate(article.date)} · ${article.author}</div>
      </div>
      <img src="${article.image}" alt="">
    </a>
  `).join('');

  const latest = document.querySelector('#latest-list');
  if (latest) {
    latest.innerHTML = articles.slice(2, 6).map(a => `<a class="latest-item" href="article?id=${encodeURIComponent(a.id)}">${a.title}</a>`).join('');
  }

  const more = document.querySelector('#more-stories');
  if (more) {
    more.innerHTML = articles.slice(2).map(card).join('');
  }
}

async function initCategory() {
  const holder = document.querySelector('#category-stories');
  if (!holder) return;

  const category = params.get('category') || 'news';
  document.querySelector('#category-title').textContent = label(category);
  if (category === 'traffic') initTrafficLivePanel();
  const articles = (await getArticles()).filter(a => a.category === category);
  holder.innerHTML = articles.length ? articles.map(card).join('') : '<p>No stories in this section yet.</p>';
}

// Roadwatch belongs on the existing Traffic category page, not a separate microsite.
// It is intentionally read-only; it never changes the article collection.
async function initTrafficLivePanel() {
  const panel=document.querySelector('#traffic-live-panel');
  if (!panel) return;
  panel.hidden=false;
  const results=panel.querySelector('#traffic-live-results');
  const checked=panel.querySelector('#traffic-live-checked');
  const showStatus=(message)=>{
    results.replaceChildren();
    const line=document.createElement('div');
    line.className='traffic-live-status';
    const dot=document.createElement('span');dot.className='traffic-live-dot';dot.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.textContent=message;
    line.append(dot,text);results.append(line);
  };
  try {
    const response=await fetch('https://witney-wire-travel-updates.maryamsediqthornton.workers.dev/feed',{cache:'no-store'});
    if(!response.ok)throw new Error('feed_unavailable');
    const feed=await response.json();
    const updated=new Date(feed.updated_at);
    if(!Number.isFinite(updated.getTime())||updated.getTime()>Date.now()+300000||Date.now()-updated.getTime()>5400000)
      throw new Error('feed_stale');
    if(feed.status!=='verified_for_publication'){
      showStatus('Verified automatic closure alerts are being prepared. Check official sources for current restrictions.');
      checked.textContent='Automatic notices pending verification · Existing traffic stories below';
      return;
    }
    const notices=(Array.isArray(feed.notices)?feed.notices:[]).filter(n=>{
      const end=new Date(n.valid_until);
      return n.geography_verified===true&&typeof n.title==='string'&&n.title.trim()&&
        typeof n.description==='string'&&n.description.trim()&&
        Number.isFinite(end.getTime())&&end.getTime()>Date.now()&&
        typeof n.source_url==='string'&&/^https:\/\/(?:[a-z0-9-]+\.)*(?:nationalhighways\.co\.uk|oxfordshire\.gov\.uk)\//i.test(n.source_url);
    }).slice(0,4);
    results.replaceChildren();
    if(!notices.length){
      showStatus('No verified notices to display at present. This does not mean the roads are clear.');
    }else{
      for(const notice of notices){
        const item=document.createElement('article');item.className='traffic-live-item';
        const title=document.createElement('strong');title.textContent=notice.title;
        const desc=document.createElement('p');desc.textContent=notice.description;
        const link=document.createElement('a');link.href=notice.source_url;
        link.rel='noopener noreferrer';link.target='_blank';link.textContent='Official details ↗';
        item.append(title,desc,link);results.append(item);
      }
    }
    checked.textContent='Last feed check: '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(updated)+' UK time';
  } catch {
    showStatus('Automatic travel notices are temporarily unavailable. Check official sources for the latest restrictions.');
    checked.textContent='Existing traffic stories remain available below';
  }
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
  const author = authorProfile(article);
  view.innerHTML = `
    <span class="label">${label(article.category)}</span>
    <h1>${article.title}</h1>
    <p class="article-summary">${article.summary}</p>
        <div class="article-author-box">
          <img class="article-author-photo" src="${author.image}" alt="${author.name}">
          <div class="article-author-details">
            <div class="article-author-name">By ${author.name}</div>
            <div class="article-author-role">${author.role}</div>
          </div>
        </div>

    <div class="meta">${formatDate(article.date)} · ${article.author}</div>
    ${article.hideHero ? '' : `<img class="article-hero${article.heroContain ? ' article-hero-contain' : ''}" src="${article.image}" alt="">`}
    ${article.id === 'witney-heatwave-34c' ? '<p class="ai-disclaimer">The image used with this story is an AI-generated illustration of Witney town centre in hot weather.</p>' : ''}
    ${article.id === 'phone-free-schools-thames-valley-fund' ? '<p class="ai-disclaimer">AI-generated illustration: Students storing mobile phones before lessons.</p>' : ''}
    ${article.id === 'mod-bicester-asylum-accommodation-concerns' ? '<p class="ai-disclaimer">AI-generated illustration: Bicester Village-style shopping area used for illustrative purposes.</p>' : ''}
    ${article.id === 'm40-roadworks-update-28-june-2026' ? '<p class="ai-disclaimer">AI-generated illustration: M40 roadworks scene used for illustrative purposes.</p>' : ''}
    ${article.id === 'bobbi-ai-community-access-policing' ? '<p class="ai-disclaimer">AI-generated illustration: community members using an AI police support assistant, shown for illustrative purposes.</p>' : ''}
    ${article.id === 'two-sentenced-drug-supply-oxford' ? '<p class="ai-disclaimer">AI-generated illustration: drugs evidence, mobile phones and scales shown for illustrative purposes.</p>' : ''}
    ${adBlock('article')}
    <div class="article-body">${renderArticleBody(article.body)}</div>
    ${haveYourSayBlock()}
    ${adBlock('article')}
  `;
}

initHome();
initCategory();
initArticle();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

