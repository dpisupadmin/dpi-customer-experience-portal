# DPI Customer Experience Portal - Standalone Architecture

Stage 3A removes Google Apps Script from the production architecture.

## Target runtime

Browser / custom domain
→ Vercel static frontend
→ Vercel Node.js API
→ PostgreSQL (Stage 3B)
→ object storage (Stage 3D)
→ standalone OTP/session service (Stage 3E)
→ email provider (Stage 3F)
→ PDF generator (Stage 3G)

GitHub remains the source-code repository. Vercel deploys directly from the GitHub repository.

## No Google Apps Script

The standalone runtime does not call or embed Apps Script URLs and does not depend on HtmlService, google.script.run, SpreadsheetApp, PropertiesService, MailApp, DriveApp, or SlidesApp.

The old Apps Script deployment may remain online temporarily as a disconnected backup while the replacement is built, but the new application does not call it.

## Stage sequence

- Stage 3A: standalone project/runtime shell
- Stage 3B: PostgreSQL schema + database layer
- Stage 3C: Customer Satisfaction Survey backend
- Stage 3D: UCUA + photo storage
- Stage 3E: OTP, sessions, admin authentication
- Stage 3F: email notifications
- Stage 3G: PDF reports
- Stage 3H: admin dashboard and exports
- Stage 3I: production domain + hardening
