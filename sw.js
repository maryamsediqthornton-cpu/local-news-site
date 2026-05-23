<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#10233f" />
  <title>Local News Hub</title>
  <meta name="description" content="A fast, editable local news website template." />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="stylesheet" href="/css/styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="topbar">
      <span id="today"></span>
      <a href="/editor.html">Editor</a>
    </div>
    <div class="brand-row container">
      <a class="brand" href="/">Local News Hub</a>
      <button id="installBtn" class="install-btn" hidden>Install app</button>
    </div>
    <nav class="nav container" aria-label="Primary navigation">
      <a href="/#latest">Latest</a>
      <a href="/category.html?cat=news">News</a>
      <a href="/category.html?cat=sport">Sport</a>
      <a href="/category.html?cat=whats-on">What's On</a>
      <a href="/category.html?cat=traffic">Traffic</a>
      <a href="/category.html?cat=community">Community</a>
    </nav>
  </header>

  <main class="container layout">
    <section class="main-column">
      <div id="hero" class="hero-card skeleton"></div>
      <h2 id="latest">Latest stories</h2>
      <div id="latestGrid" class="story-grid"></div>
    </section>

    <aside class="sidebar">
      <section class="panel">
        <h2>Trending</h2>
        <ol id="trendingList" class="trending-list"></ol>
      </section>
      <section class="panel newsletter">
        <h2>Daily briefing</h2>
        <p>Replace this with your email signup provider, sponsor message, or community notice.</p>
        <form onsubmit="event.preventDefault(); alert('Connect this form to your email tool.');">
          <input type="email" placeholder="Email address" required />
          <button>Sign up</button>
        </form>
      </section>
      <section class="panel ad-slot">Advert / sponsor block</section>
    </aside>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div><strong>Local News Hub</strong><p>Edit this footer in index.html.</p></div>
      <div><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a></div>
    </div>
  </footer>
  <script src="/js/app.js" type="module"></script>
</body>
</html>
