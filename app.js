function renderArticleBody(body = []) {
  const paragraphs = Array.isArray(body) ? body : [body];

  return paragraphs.map((text, index) => {
    const paragraph = `<p>${text}</p>`;

    // FIRST ARTICLE AD
    if (index === 0) {
      return paragraph + adBlock('article');
    }

    // SECOND ARTICLE AD FOR LONGER STORIES
    if (index === paragraphs.length - 2 && paragraphs.length >= 4) {
      return paragraph + adBlock('article');
    }

    return paragraph;
  }).join('');
}
