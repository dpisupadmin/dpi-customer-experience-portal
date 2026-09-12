/* DPI Customer Experience Portal - GitHub API adapter
 * Stage 2 package: frontend is GitHub-ready; backend is intentionally disabled
 * until the Apps Script API endpoint is deployed in Stage 3.
 */
(function(){
  'use strict';

  const CONFIG = {
    // Stage 3: paste the deployed Apps Script /exec endpoint here.
    endpoint: '',
    timeoutMs: 30000
  };

  async function call(method, args){
    if(!CONFIG.endpoint){
      throw new Error(
        'Backend connection is not enabled yet. The GitHub frontend is running correctly; complete Stage 3 to connect Google Apps Script.'
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), CONFIG.timeoutMs);
    try {
      // text/plain is deliberate: it avoids a browser CORS preflight for Apps Script.
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        redirect: 'follow',
        headers: {'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify({method, args: args || []}),
        signal: controller.signal
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch (_) { throw new Error('Backend returned an invalid response.'); }
      if(!response.ok || !data.ok){
        throw new Error((data && data.error) || ('Backend request failed ('+response.status+').'));
      }
      return data.result;
    } finally {
      clearTimeout(timer);
    }
  }

  window.DPI_API = { CONFIG, call };
})();
