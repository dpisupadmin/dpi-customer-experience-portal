# Stage 3A Setup Guide

## Goal
Create the standalone Node.js application shell in the existing GitHub repository. This stage deliberately does not connect to Google Apps Script and deliberately does not write production data yet.

## Repository cleanup
Before uploading this package, delete these old migration artifacts from the GitHub repository if present:

- `apps-script/` (entire folder)
- old `MIGRATION_GUIDE.md`

Do not delete the current working frontend files until the Stage 3A upload is ready.

## Upload this package
Upload the contents of this package into the repository root. Replace existing files when GitHub detects the same paths.

Expected root after Stage 3A:

```
index.html
package.json
vercel.json
.env.example
.gitignore
api/
assets/
css/
docs/
js/
lib/
supabase/
tests/
README.md
```

There should be NO `apps-script/` folder.

## What works immediately
- Portal UI/navigation
- DPI logo/design
- Standalone API adapter
- `/api/health` once deployed to Vercel
- explicit backend method allow-list

## What intentionally does not work yet
- Customer Survey submit
- UCUA submit
- OTP
- Admin login
- dashboards/reports

Those return a clear Stage 3B message until the database and services are implemented.

## Vercel deployment (next guided step)
GitHub Pages cannot execute Node.js API code. Keep GitHub as the repository, but connect the repository to Vercel so the static frontend and `/api/*` functions run together.

After Vercel deployment, test:

- `/` — portal UI
- `/api/health` — should return JSON with `"googleAppsScript": false`

Do not add any Apps Script URL or Google secret anywhere in this repository.
