// Explicit allow-list of portal operations.
// Stage 3A only provides the transport shell. Business logic is implemented in later stages.
export const PORTAL_METHODS = Object.freeze([
  'submitCustomerSurvey',
  'submitObservation',
  'requestMySubmissionsOtp',
  'verifyMySubmissionsOtp',
  'getMySubmissionsBySession',
  'endMySubmissionsSession',
  'adminRequestOtp',
  'adminVerifyOtp',
  'adminEndSession',
  'adminGetDashboard',
  'adminListObservations',
  'adminGetObservation',
  'adminDeleteObservation',
  'adminGetMonthlyReportCsv',
  'adminGetAuditLog',
  'adminSetRecognition',
  'adminRemoveRecognition',
  'adminGetShareInfo',
  'adminGetCustomerSurveys',
  'adminGetCustomerSurveyCsv',
  'adminDeleteCustomerSurvey'
]);

export function isAllowedMethod(method){
  return PORTAL_METHODS.includes(String(method || ''));
}
