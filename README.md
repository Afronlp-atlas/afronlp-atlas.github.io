# AfroNLP Atlas

A static, single-page MVP for discovering African NLP datasets, models, benchmarks, and papers. No build step, no backend — just `index.html`, `style.css`, and `app.js`.

## Files

```
afronlp-atlas/
├── index.html   # markup + Tailwind (via CDN) + config
├── style.css    # small supplementary styles (task colors, focus states)
├── app.js       # mock asset data + search/filter logic
└── README.md
```

## Run it locally

No build tools needed — just open it, or serve it so relative paths behave the same as they will on GitHub Pages:

```bash
cd afronlp-atlas
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. **Create a repository** (or use an existing one) and push these three files to the root, or to a `/docs` folder — either works.

   ```bash
   git init
   git add index.html style.css app.js README.md
   git commit -m "Initial AfroNLP Atlas MVP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Enable Pages** in the repo:
   - Go to **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **Deploy from a branch**.
   - Pick the **`main`** branch and the **`/ (root)`** folder (or **`/docs`** if you used that).
   - Save.

3. **Wait a minute**, then GitHub shows the live URL at the top of the Pages settings page — typically:

   ```
   https://<your-username>.github.io/<your-repo>/
   ```

4. **Update the two placeholder links** in `index.html` before sharing widely:
   - The GitHub issue template link (`https://github.com/your-org/afronlp-atlas/issues/new?template=new-asset.yml`) — point it at your real repo, and add a matching `.github/ISSUE_TEMPLATE/new-asset.yml` there (fields are listed in the site's Contribute section).
   - The Google Form link (`https://forms.gle/your-form-id`).

That's it — no CI, no bundler, no environment variables.

## Extending it

- **Add real assets**: edit the `ASSETS` array at the top of `app.js`. Each entry needs `name`, `description`, `languages` (array), `task` (must match one of `TASK_TYPES`), `source`, `format`, and `url`.
- **Add a new task type**: add it to `TASK_TYPES` in `app.js`, and give it a color pair (`.task-bar` / `.task-badge`) in `style.css`.
- **Load assets from a JSON file instead of hardcoding**: replace the `ASSETS` constant with a `fetch('assets.json').then(...)` call at the bottom of `app.js` — everything else (filtering, rendering) stays the same.
- **Swap the mock submission links** for a real GitHub Issue Form (`.yml`) once you're hosting this in an org repo — GitHub's issue forms map cleanly onto the fields already listed in the Contribute section.
