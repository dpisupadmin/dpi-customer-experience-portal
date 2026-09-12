# Migration Guide — Stage 2 to Stage 3

## 1. Upload Stage 2 package to GitHub

Replace the current test `index.html` and upload the package folders/files while preserving their paths.

At the end, the repository root should contain:

```
README.md
index.html
MIGRATION_GUIDE.md
css/
js/
assets/
apps-script/
```

GitHub Pages already deploys from `main / (root)`, so no Pages setting change is required.

## 2. What should work now

The page layout, portal-home navigation, responsive design, local UI interactions, and module switching should load from GitHub.

Anything that needs Google Sheets, Gmail, OTP, admin data, PDF generation, or server-side storage will display a "Backend connection is not enabled yet" error until Stage 3.

That behavior is intentional so the existing live Apps Script system remains untouched while the frontend is tested.

## 3. Stage 3 backend connection

Do NOT deploy `apps-script/API_BRIDGE_STAGE3.gs` blindly.

First compare it with the current live `Code.gs`. If the live project already contains `doPost(e)`, merge the router rather than adding another one.

After the API bridge is deployed as a Web App, place its `/exec` URL in:

```
js/api.js
```

Change:

```
endpoint: ''
```

to the deployed endpoint.

## 4. Security before production

Before making the GitHub URL the production portal, Stage 3 should add request validation, an explicit backend-method allowlist, authentication/session review for Admin, rate limiting where appropriate, and testing of browser-origin/CORS behavior.

No frontend JavaScript secret can be considered private on GitHub Pages.
