
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

function escapeEditorialCredit(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function trustedEditorialLink(value) {
  try {
    const url = new URL(value);
    if(url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    return ['news.oxfordshire.gov.uk', 'news.westoxon.gov.uk', 'commons.wikimedia.org'].includes(host) ? url.href : null;
  } catch { return null; }
}

function renderEditorialCredits(block) {
  if (!block || block.type !== 'editorial-credits') return '';
  const official = trustedEditorialLink(block.sourceUrl);
          const image = trustedEditorialLink(block.imageUrl);
          const source = escapeEditorialCredit(block.sourcePublisher);
          const date = escapeEditorialCredit(block.sourceDate);
          const credit = escapeEditorialCredit(block.imageCredit);
          const note = escapeEditorialCredit(block.imageNote);
          return `<aside class="editorial-credits" aria-label="Article sources and image credits">
            <div class="editorial-credits-item">
              <span class="editorial-credits-label">Source</span>
              <span>${source}${date ? ' · ' + date : ''}</span>
              ${official ? `<a href="${escapeEditorialCredit(official)}" target="_blank" rel="noopener noreferrer">Official announcement ↗</a>` : ''}
            </div>
            <div class="editorial-credits-item">
              <span class="editorial-credits-label">Image</span>
              <span>${credit}${note ? ' · ' + note : ''}</span>
              ${image ? `<a href="${escapeEditorialCredit(image)}" target="_blank" rel="noopener noreferrer">Image details &amp; licence ↗</a>` : ''}
            </div>
          </aside>`;
}

function renderSourceAttribution(credit) {
  if (!credit) return '';
  const source = trustedEditorialLink(credit.source);
  const image = trustedEditorialLink(credit.image);
  return `<aside class="newsroom-attribution" aria-label="Sources and image credits">
    <div class="newsroom-attribution-line"><strong>Source</strong><span>${escapeEditorialCredit(credit.publisher)} · ${escapeEditorialCredit(credit.date)}</span>${source ? `<a href="${escapeEditorialCredit(source)}" target="_blank" rel="noopener noreferrer">Original announcement ↗</a>` : ''}</div>
    <div class="newsroom-attribution-line"><strong>Image credit</strong><span>${escapeEditorialCredit(credit.credit)} · ${escapeEditorialCredit(credit.note)}</span>${image ? `<a href="${escapeEditorialCredit(image)}" target="_blank" rel="noopener noreferrer">Image details &amp; licence ↗</a>` : ''}</div>
  </aside>`;
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

      if (typeof block === 'object') return '';
      if (typeof block === 'string' && (block.startsWith('Source: ') || block.startsWith('Image credit: '))) {
        const isSource = block.startsWith('Source: ');
        const marker = isSource ? ' Official announcement: ' : ' Image details: ';
        const split = block.indexOf(marker);
        const description = split >= 0 ? block.slice(0, split) : block;
        const url = split >= 0 ? trustedEditorialLink(block.slice(split + marker.length)) : null;
        return `<div class="newsroom-credit-row">
          <span class="newsroom-credit-label">${isSource ? 'Reporting source' : 'Photograph'}</span>
          <span class="newsroom-credit-copy">${escapeEditorialCredit(description.replace(/^(?:Source|Image credit): /, ''))}</span>
          ${url ? `<a href="${escapeEditorialCredit(url)}" target="_blank" rel="noopener noreferrer">${isSource ? 'View original report' : 'Photo &amp; licence'} ↗</a>` : ''}
        </div>`;
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
      <img class="${article.id === 'witney-students-night-at-musicals-children-in-need-2026' ? 'musicals-lead-photo' : ''}" ${article.id === 'witney-students-night-at-musicals-children-in-need-2026' ? 'style="object-fit:contain;object-position:center center;background:#f5f7f6;"' : ''} src="${article.image}" alt="">
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
  if (category === 'traffic') {
    // Expired one-off traffic reports stay available at their original article URLs.
    // They are moved out of the current listing, never deleted from articles.json.
    const threshold=Date.now()-60*24*60*60*1000;
    const isHistorical=a=>Number.isFinite(Date.parse(a.date))&&Date.parse(a.date)<threshold&&
      /(?:roadworks?|lane closures?|slip road closures?|road closures?|closed between|traffic delays?)/i.test(a.title);
    const current=articles.filter(a=>!isHistorical(a));
    const archive=articles.filter(isHistorical);
    holder.innerHTML=current.length?current.map(card).join(''):'';
    const existing=document.querySelector('#traffic-archive');
    if(existing)existing.remove();
    if(archive.length){
      const details=document.createElement('details');details.id='traffic-archive';details.className='traffic-archive';
      const summary=document.createElement('summary');summary.textContent='Earlier traffic reports ('+archive.length+')';
      const note=document.createElement('p');note.textContent='Previous roadworks and incident reports are archived for reference. Dates and restrictions may no longer apply.';
      const grid=document.createElement('div');grid.className='card-grid';grid.innerHTML=archive.map(card).join('');
      details.append(summary,note,grid);
      holder.after(details);
    }
    if(!current.length){
      const note=document.createElement('p');note.className='traffic-current-empty';note.textContent='Current roadwatch updates are shown above. Older traffic reports are available in the archive below.';
      holder.before(note);
    }
  } else {
    holder.innerHTML=articles.length?articles.map(card).join(''):'<p>No stories in this section yet.</p>';
  }
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
      // Separate explicitly-labelled editorial preview, never presented as live closures.
      try {
        const reviewResponse=await fetch('/api/roadwatch-preview',{cache:'no-store'});
        if(!reviewResponse.ok)throw new Error('preview_unavailable');
        const review=await reviewResponse.json();
        const candidates=(Array.isArray(review.notices)?review.notices:[]).filter(n=>{
          const end=Date.parse(n.valid_until||'');
          return /^(M40|A40)$/.test(n.road)&&Number.isFinite(end)&&end>Date.now()&&
            typeof n.description==='string'&&n.description.trim();
        }).slice(0,6);
        if(candidates.length){
          results.replaceChildren();
          const heading=document.createElement('p');
          heading.className='traffic-live-status';
          heading.style.fontWeight='700';
          heading.textContent='National Highways records — unverified preview. Not live travel advice; check official sources before travelling.';
          results.append(heading);
          const fmt=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:false,timeZone:'Europe/London'});
          const cleanLocation=(raw)=>String(raw||'').replace(/\\bbetween\\s+(J\\d+[A-Z]?)\\s+and\\s+(J\\d+[A-Z]?)/i,'$1–$2').trim();
          const restrictionText=(n)=>{
            const comment=String(n.official_comment||'').trim();
            const normalised=comment.replace(/\s+/g,' ');
            const reason=String(n.reason||'')==='roadMaintenance'?' for road maintenance':'';
            // The official plain-English comment is more reliable than raw DATEX lane codes.
            // Preserve all lane numbers; never imply a whole motorway closure.
            const restriction=normalised.match(/(?:hard shoulder(?:,\s*lanes?\s*[\d\s,and]+)?|(?:exit\s+slip\s+road\s+)?lanes?\s+\d+(?:\s*(?:and|&|,)\s*\d+)*)\s+closure/i);
            if(restriction){
              let words=restriction[0].replace(/\s+/g,' ').trim();
              words=words.charAt(0).toUpperCase()+words.slice(1);
              return words+reason;
            }
            const general=normalised.match(/\b(?:full closure|carriageway closure|road closed|slip road closed)\b/i);
            if(general)return general[0]+reason;
            if(normalised)return 'National Highways states: '+normalised;
            return 'National Highways has not supplied a readable restriction description.';
          };
          for(const n of candidates){
            const item=document.createElement('article');item.className='traffic-live-item';
            const title=document.createElement('strong');title.textContent=cleanLocation(n.description);
            const detail=document.createElement('p');detail.textContent=restrictionText(n);
            const time=document.createElement('p');time.style.fontSize='0.85em';
            const start=Date.parse(n.valid_from||''),end=Date.parse(n.valid_until||'');
            time.textContent=Number.isFinite(start)&&Number.isFinite(end)?fmt.format(new Date(start))+' – '+fmt.format(new Date(end))+' (UK time)':'Times not confirmed';
            item.append(title,detail,time);results.append(item);
          }
          checked.textContent='Unverified preview · Last checked: '+fmt.format(new Date(review.updated_at))+' · National Highways records';
          return;
        }
      }catch{}
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
    ${renderSourceAttribution(article.sourceAttribution)}
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

