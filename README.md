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
