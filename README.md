<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Content Editor</title><link rel="stylesheet" href="/css/styles.css"></head><body>
<header class="site-header"><div class="brand-row container"><a class="brand" href="/">Local News Hub</a></div></header>
<main class="container editor"><h1>Simple article editor</h1><p>This static editor lets you paste/edit JSON and download an updated <code>articles.json</code>. Replace <code>/data/articles.json</code> before deploying.</p>
<div class="editor-actions"><button id="loadSample">Load current content</button><button id="downloadJson">Download articles.json</button></div>
<textarea id="jsonEditor" spellcheck="false" placeholder="Paste articles JSON here..."></textarea>
<p class="hint">For a full CMS later, connect Cloudflare Pages to GitHub and edit this JSON file, or replace it with Sanity/Strapi/Directus.</p></main>
<script src="/js/editor.js" type="module"></script></body></html>
