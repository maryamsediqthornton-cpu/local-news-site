(() => {
  'use strict';
  const view = document.querySelector('#article-view');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!view || !id) return;

  function addShareButton() {
    const heading = view.querySelector('h1');
    const meta = view.querySelector('.meta');
    if (!heading || !meta || view.querySelector('.article-share')) return false;

    const link = new URL('/article', 'https://witneywire.co.uk');
    link.searchParams.set('id', id);
    const shareData = { title: heading.textContent.trim(), url: link.href };

    const area = document.createElement('div');
    area.className = 'article-share';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'article-share-button';
    button.textContent = 'Share this story';
    const status = document.createElement('span');
    status.className = 'article-share-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const manual = document.createElement('label');
    manual.className = 'article-share-manual';
    manual.hidden = true;
    manual.append('Copy this link:');
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.value = shareData.url;
    input.setAttribute('aria-label', 'Article link');
    input.addEventListener('focus', () => input.select());
    manual.append(input);

    async function copyLink() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(shareData.url);
        status.textContent = 'Link copied';
        manual.hidden = true;
      } catch {
        status.textContent = 'Select and copy the link below.';
        manual.hidden = false;
        input.focus();
        input.select();
      }
    }

    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '';
      manual.hidden = true;
      try {
        if (typeof navigator.share === 'function') {
          try {
            await navigator.share(shareData);
          } catch (error) {
            if (!error || error.name !== 'AbortError') await copyLink();
          }
        } else {
          await copyLink();
        }
      } finally {
        button.disabled = false;
      }
    });
    area.append(button, status, manual);
    meta.after(area);
    return true;
  }

  if (!addShareButton()) {
    const observer = new MutationObserver(() => {
      if (addShareButton()) observer.disconnect();
    });
    observer.observe(view, { childList: true, subtree: true });
  }
})();
