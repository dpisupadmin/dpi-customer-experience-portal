# Existing frontend operation map

The current frontend calls these operations. They are retained as a compatibility contract while the backend is rebuilt from scratch.

## Public/customer
- submitCustomerSurvey
- submitObservation
- requestMySubmissionsOtp
- verifyMySubmissionsOtp
- getMySubmissionsBySession
- endMySubmissionsSession
- trackAnonymous

## Administration
- adminRequestOtp
- adminVerifyOtp
- adminEndSession
- adminGetDashboard
- adminListObservations
- adminGetObservation
- adminDeleteObservation
- adminGetMonthlyReportCsv
- adminGetAuditLog
- adminSetRecognition
- adminRemoveRecognition
- adminGetShareInfo
- adminGetCustomerSurveys
- adminGetCustomerSurveyCsv
- adminDeleteCustomerSurvey

Stage 3A allow-lists these method names in `lib/methods.js`. The API currently returns HTTP 501 for them. Business logic is implemented progressively from Stage 3B onward.
