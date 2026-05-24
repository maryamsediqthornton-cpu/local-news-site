Witney Wire — Article Ad Fix Patch

WHY IT DIDN'T SHOW:
The original article templates were too short for the previous ad insertion logic.

The old logic only showed ads:
- after paragraph 2
- after paragraph 7

Most current articles only contain 1–3 paragraphs.

THIS FIX:
- inserts first article ad after the FIRST paragraph
- inserts second article ad near the end of longer stories
- works immediately with current article lengths

FILES INCLUDED:
- app.js patch only

HOW TO APPLY:
1. Open your existing app.js
2. Find the current renderArticleBody() function
3. Replace ONLY that function with the new one
4. Commit + Push via GitHub Desktop

No other files changed.
