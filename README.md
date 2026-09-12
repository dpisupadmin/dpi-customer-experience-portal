# DPI Customer Experience Portal — GitHub Frontend

This package was migrated from the existing Google Apps Script `Index.html` frontend.

## Stage 2 status

- GitHub Pages compatible frontend: **ready**
- Google Apps Script banner: **removed** (because the page is served by GitHub Pages)
- DPI portal UI: **migrated**
- Embedded DPI logo: **extracted to `assets/images/dpi-logo.png`**
- CSS: **moved to `css/portal.css`**
- Frontend JavaScript: **moved to `js/portal.js`**
- `google.script.run`: **replaced by `DPI_API.call()` adapter**
- Live backend connection: **intentionally disabled until Stage 3**

## Files

```
index.html
css/portal.css
js/api.js
js/portal.js
assets/images/dpi-logo.png
apps-script/API_BRIDGE_STAGE3.gs
MIGRATION_GUIDE.md
README.md
```

## Backend methods detected in the old frontend

- `adminDeleteCustomerSurvey`
- `adminDeleteObservation`
- `adminEndSession`
- `adminGetAuditLog`
- `adminGetCustomerSurveyCsv`
- `adminGetCustomerSurveys`
- `adminGetDashboard`
- `adminGetMonthlyReportCsv`
- `adminGetObservation`
- `adminGetShareInfo`
- `adminListObservations`
- `adminRemoveRecognition`
- `adminRequestOtp`
- `adminSetRecognition`
- `adminVerifyOtp`
- `endMySubmissionsSession`
- `getMySubmissionsBySession`
- `requestMySubmissionsOtp`
- `submitCustomerSurvey`
- `submitObservation`
- `trackAnonymous`
- `verifyMySubmissionsOtp`

## Important

Do not paste passwords, OTPs, private keys, spreadsheet data, or Apps Script secrets into this public GitHub repository.
