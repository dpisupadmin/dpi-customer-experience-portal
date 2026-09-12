/**
 * DPI Customer Experience Portal - GitHub API Bridge (Stage 3)
 *
 * ADD this to the existing Apps Script backend only after we review the live Code.gs.
 * It assumes the 22 named backend functions already exist.
 *
 * IMPORTANT: If your existing project already has doPost(e), merge the router into it
 * instead of creating a second doPost.
 */

const GITHUB_API_METHODS = new Set([
  'adminDeleteCustomerSurvey',
  'adminDeleteObservation',
  'adminEndSession',
  'adminGetAuditLog',
  'adminGetCustomerSurveyCsv',
  'adminGetCustomerSurveys',
  'adminGetDashboard',
  'adminGetMonthlyReportCsv',
  'adminGetObservation',
  'adminGetShareInfo',
  'adminListObservations',
  'adminRemoveRecognition',
  'adminRequestOtp',
  'adminSetRecognition',
  'adminVerifyOtp',
  'endMySubmissionsSession',
  'getMySubmissionsBySession',
  'requestMySubmissionsOtp',
  'submitCustomerSurvey',
  'submitObservation',
  'trackAnonymous',
  'verifyMySubmissionsOtp'
]);

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const method = String(request.method || '');
    const args = Array.isArray(request.args) ? request.args : [];

    if (!GITHUB_API_METHODS.has(method)) {
      throw new Error('Unsupported API method.');
    }

    const fn = globalThis[method];
    if (typeof fn !== 'function') {
      throw new Error('Backend method is not available: ' + method);
    }

    const result = fn.apply(null, args);
    return dpiJson_({ok:true, result:result});
  } catch (err) {
    return dpiJson_({ok:false, error:(err && err.message) ? err.message : String(err)});
  }
}

function dpiJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
