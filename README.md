# DPI Customer Experience Portal

Standalone rebuild of the DPI Customer Experience Portal.

## Stage 3A status

- Existing DPI frontend preserved
- Google Apps Script runtime dependency removed
- Standalone Node.js API shell added
- API operation allow-list added
- Health endpoint added
- PostgreSQL/Supabase, storage, OTP, email and PDF layers reserved for following stages

## Architecture

GitHub → Vercel → Node.js API → PostgreSQL / storage / email / PDF services

Google Apps Script is not part of the new runtime architecture.

## Stage 3A test

After deployment to Vercel:

```text
GET /api/health
```

Expected response includes:

```json
{
  "ok": true,
  "stage": "3A",
  "runtime": "standalone",
  "googleAppsScript": false,
  "databaseConnected": false
}
```

See `docs/STAGE3A_SETUP.md` for the installation steps.


## Stage 3G.3
Adds full Customer Satisfaction Survey PDF view/download and independent Customer Survey/UCUA submission notification recipient lists.

Deployment steps:
1. Run `supabase/migrations/20261006_stage3g3_notifications.sql` in Supabase SQL Editor.
2. Configure Vercel server-side environment variables: `SMTP_USER`, `SMTP_PASS`. Optional: `SMTP_HOST` (default smtp.gmail.com), `SMTP_PORT` (default 587), `SMTP_SECURE` (default false), `SMTP_FROM`, `PORTAL_PUBLIC_URL`.
3. Never commit SMTP credentials to GitHub. For Gmail, `SMTP_PASS` must be an App Password, not the normal account password.
4. Redeploy after adding environment variables.
