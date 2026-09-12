/* DPI Customer Experience Portal - standalone API adapter
 * Stage 3A: Google Apps Script has been completely removed from the runtime path.
 */
(function(){
  'use strict';

  const runtime = window.DPI_CONFIG || {};
  const baseUrl = String(runtime.apiBaseUrl || '').replace(/\/$/, '');
  const timeoutMs = Number(runtime.apiTimeoutMs || 30000);

  function apiUrl(path){
    return baseUrl + path;
  }

  async function requestJson(path, options){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(apiUrl(path), {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options && options.headers ? options.headers : {})
        },
        signal: controller.signal
      });

      const text = await response.text();
      let data = {};
      if(text){
        try { data = JSON.parse(text); }
        catch (_) { throw new Error('The standalone API returned an invalid response.'); }
      }

      if(!response.ok || data.ok === false){
        const message = (data && (data.error || data.message)) || ('API request failed (' + response.status + ').');
        throw new Error(message);
      }
      return data;
    } catch(error){
      if(error && error.name === 'AbortError'){
        throw new Error('The standalone API request timed out.');
      }
      if(error instanceof TypeError){
        throw new Error(
          'Standalone backend is not connected yet. Complete Stage 3A deployment before testing submissions or sign-in.'
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function call(method, args){
    const data = await requestJson('/api/rpc', {
      method: 'POST',
      body: JSON.stringify({ method, args: Array.isArray(args) ? args : [] })
    });
    return data.result;
  }

  async function health(){
    return requestJson('/api/health', { method: 'GET' });
  }

  window.DPI_API = {
    CONFIG: Object.freeze({ baseUrl, timeoutMs }),
    call,
    health
  };
})();
