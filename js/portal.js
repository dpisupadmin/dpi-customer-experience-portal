
  const SESSION_STORAGE_KEY='ucua_history_session_v2', SESSION_EXPIRY_KEY='ucua_history_session_expiry_v2';
  const ADMIN_SESSION_KEY='ucua_admin_session_v3', ADMIN_EXPIRY_KEY='ucua_admin_expiry_v3';
  let currentReviewRef='';


  function localDateTimeValue(d){const pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
  function setDefaultObservationDateTime(){const el=document.getElementById('observationDateTime');if(el&&!el.value)el.value=localDateTimeValue(new Date())}
  function toggleOtherLocation(){const sel=document.getElementById('locationSelect'),wrap=document.getElementById('otherLocationWrap'),other=document.getElementById('otherLocation');const isOther=sel&&sel.value==='Others';if(wrap)wrap.style.display=isOther?'block':'none';if(!isOther&&other)other.value=''}
  function toggleAnonymousSubmission(){const a=document.getElementById('anonymousSubmit')?.checked;['nameWrap','emailWrap','companyWrap'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=a?'none':''});if(a){document.getElementById('name').value='';document.getElementById('email').value='';document.getElementById('company').value='';const oc=document.getElementById('otherCompany');if(oc)oc.value='';toggleOtherCompany();}}
  function getSelectedLocation(){const sel=document.getElementById('locationSelect');if(!sel||!sel.value)return'';if(sel.value==='Others')return(document.getElementById('otherLocation').value||'').trim();return sel.value}


  let portalMode='home';

  function hideAllPanes(){document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));const u=document.getElementById('ucuaInternalNav');if(u)u.classList.remove('active')}
  function setModuleNav(mode){
    const nav=document.getElementById('moduleNav');
    const u=document.getElementById('ucuaModuleNav'),s=document.getElementById('surveyModuleNav'),a=document.getElementById('adminModuleNav');
    if(!nav)return;
    nav.style.display=mode==='home'?'none':'block';
    if(u)u.style.display=mode==='ucua'?'block':'none';
    if(s)s.style.display=mode==='survey'?'flex':'none';
    if(a)a.style.display=mode==='admin'?'flex':'none';
  }

  function setPortalHeader(mode){
    const eyebrow=document.getElementById('moduleEyebrow');
    const title=document.getElementById('moduleBrandTitle');
    const sub=document.getElementById('moduleBrandSub');
    if(!title)return;
    if(sub){sub.textContent='';sub.style.display='none';}
    if(mode==='ucua'){
      if(eyebrow)eyebrow.textContent='DPI CUSTOMER EXPERIENCE PORTAL';
      title.textContent='U-See U-Act';
    }else if(mode==='survey'){
      if(eyebrow)eyebrow.textContent='DPI CUSTOMER EXPERIENCE PORTAL';
      title.textContent='Share your voice. Help us build better.';
    }else if(mode==='admin'){
      if(eyebrow)eyebrow.textContent='DPI CUSTOMER EXPERIENCE PORTAL';
      title.textContent='Administration Access';
    }else{
      if(eyebrow)eyebrow.textContent='DPI CUSTOMER EXPERIENCE PORTAL';
      title.textContent='Customer Experience Portal';
    }
  }

  function showPortalHome(){
    portalMode='home';setPortalHeader('home');hideAllPanes();setModuleNav('home');
    document.getElementById('portalOverlay').classList.add('show');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function openPortalModule(mode){
    portalMode=mode;setPortalHeader(mode);document.getElementById('portalOverlay').classList.remove('show');hideAllPanes();setModuleNav(mode);
    if(mode==='ucua'){
      document.getElementById('submit').classList.add('active');
      document.getElementById('ucuaInternalNav').classList.add('active');document.querySelectorAll('#ucuaInternalNav .tab').forEach(x=>x.classList.toggle('active',x.dataset.pane==='submit'));
    }else if(mode==='survey'){
      document.getElementById('customerSurvey').classList.add('active');
    }else if(mode==='admin'){
      document.getElementById('admin').classList.add('active');restoreAdminSession();
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function currentMonth(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  document.getElementById('dashMonth').value=currentMonth();document.getElementById('obsMonth').value=currentMonth();document.getElementById('recMonth').value=currentMonth();setDefaultObservationDateTime();document.getElementById('surveyMonth').value=currentMonth();document.getElementById('cssDate').value=new Date().toISOString().slice(0,10);

  document.querySelectorAll('#ucuaInternalNav .tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('#ucuaInternalNav .tab').forEach(x=>x.classList.remove('active'));
    ['submit','history','anonymous'].forEach(id=>document.getElementById(id).classList.remove('active'));
    btn.classList.add('active');document.getElementById(btn.dataset.pane).classList.add('active');
    if(btn.dataset.pane==='history')restoreHistorySession();
  }));
function setMsg(id,text,type){const e=document.getElementById(id);e.textContent=text||'';e.className='msg'+(text?' show '+type:'')}
  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function fmt(iso){if(!iso)return'';try{return new Date(iso).toLocaleString()}catch(e){return iso}}
  function fmtDateInput(iso){if(!iso)return'';try{return new Date(iso).toISOString().slice(0,10)}catch(e){return''}}
  function statusPill(s){s=String(s||'OPEN').toUpperCase();let c=s==='CLOSED'?' closed':s==='IN PROGRESS'?' progress':'';return `<span class="pill${c}">${esc(s)}</span>`}
  function gs(method,args,ok,fail){window.DPI_API.call(method,args||[]).then(ok).catch(fail||((e)=>alert(e.message||e)))}
  async function fileData(){const f=document.getElementById('photo').files[0];if(!f)return null;if(f.size>5*1024*1024)throw new Error('Photo must be 5 MB or smaller.');return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:f.name,mimeType:f.type,base64:String(r.result).split(',')[1]});r.onerror=reject;r.readAsDataURL(f)})}


  function selectedSurveyScore(name){const el=document.querySelector('input[name="'+name+'"]:checked');return el?Number(el.value):0}
  function submitCustomerSurveyForm(){
    const btn=document.getElementById('cssSubmitBtn');setMsg('cssMsg','','');document.getElementById('cssResult').innerHTML='';
    const keys=['a1','a2','a3','a4','a5','b1','b2','b3','b4','b5','c1','c2','c3','c4','c5','d1','d2','d3','d4','d5'];
    const scores={};keys.forEach(k=>scores[k]=selectedSurveyScore('css_'+k));
    const payload={customerName:document.getElementById('cssCustomerName').value,email:document.getElementById('cssEmail').value,company:document.getElementById('cssCompany').value,location:document.getElementById('cssLocation').value,equipmentOnSite:document.getElementById('cssEquipment').value,crewOnSite:document.getElementById('cssCrew').value,surveyDate:document.getElementById('cssDate').value,comments:document.getElementById('cssComments').value,scores:scores};
    btn.disabled=true;btn.textContent='Submitting Survey...';
    gs('submitCustomerSurvey',[payload],r=>{
      setMsg('cssMsg','Thank you. Your Customer Satisfaction Survey has been submitted successfully.','ok');
      document.getElementById('cssResult').innerHTML=`<div class="surveySuccess"><div>Survey Reference</div><div class="ref">${esc(r.reference)}</div><div><strong>Overall Satisfaction: ${Number(r.overallAverage).toFixed(2)} / 5 (${Number(r.percentage).toFixed(1)}%)</strong></div><div class="privacy">${r.customerCopySent?'A submission confirmation has been emailed to the customer.':'The survey was recorded, but the customer confirmation email could not be sent.'}<br>${r.adminNotificationSent?(r.adminPdfAttached?'Admin/HSE has been notified with the PDF report attached.':'Admin/HSE has been notified using the full HTML report; PDF generation was unavailable for this submission.'):'Admin/HSE email notification could not be sent; the response remains available in Administration.'}</div></div>`;
      btn.disabled=false;btn.textContent='Submit Customer Survey';
      document.getElementById('cssCustomerName').value='';document.getElementById('cssEmail').value='';document.getElementById('cssCompany').value='';document.getElementById('cssLocation').value='';document.getElementById('cssEquipment').value='';document.getElementById('cssCrew').value='';document.getElementById('cssComments').value='';document.querySelectorAll('#customerSurvey input[type=radio]').forEach(x=>x.checked=false);
    },e=>{btn.disabled=false;btn.textContent='Submit Customer Survey';setMsg('cssMsg',e.message||String(e),'err')});
  }

  async function submitForm(){const btn=document.getElementById('submitBtn');setMsg('submitMsg','','');document.getElementById('submitResult').innerHTML='';btn.disabled=true;btn.textContent='Submitting...';try{const isAnon=!!document.getElementById('anonymousSubmit')?.checked;const payload={anonymous:isAnon,name:isAnon?'':document.getElementById('name').value,email:isAnon?'':document.getElementById('email').value,observationDateTime:document.getElementById('observationDateTime').value,company:isAnon?'':document.getElementById('company').value,observationType:document.getElementById('observationType').value,location:getSelectedLocation(),observation:document.getElementById('observation').value,actionTaken:document.getElementById('actionTaken').value,photo:await fileData()};gs('submitObservation',[payload],r=>{setMsg('submitMsg','Observation submitted successfully.','ok');let extra=r.anonymous?`<div class="detail" style="margin-top:10px"><strong>Private tracking token</strong><div class="token">${esc(r.trackingToken)}</div><div class="privacy">Save both the reference and this token.</div></div>`:'<div class="privacy">Use My Submissions and email OTP to review this observation later.</div>';document.getElementById('submitResult').innerHTML=`<div class="result"><div class="ref">${esc(r.reference)}</div><div class="meta">${fmt(r.submittedAt)}</div>${extra}</div>`;btn.disabled=false;btn.textContent='Submit Observation'},e=>{setMsg('submitMsg',e.message||String(e),'err');btn.disabled=false;btn.textContent='Submit Observation'})}catch(e){setMsg('submitMsg',e.message||String(e),'err');btn.disabled=false;btn.textContent='Submit Observation'}}

  function renderRecord(r){return `<div class="record"><div class="recordtop"><div><h4>${esc(r.reference)} · ${esc(r.observationType)}</h4><div class="meta">${r.observationDateTime?'Observed: '+fmt(r.observationDateTime)+' · ':''}Submitted: ${fmt(r.submittedAt)} · ${esc(r.location)}</div></div></div><p><strong>Observation</strong><br>${esc(r.observation)}</p>${r.actionTaken?`<p><strong>Immediate action</strong><br>${esc(r.actionTaken)}</p>`:''}${r.hasPhoto?'<div class="detail" style="margin-top:10px">📎 Photo attached</div>':''}</div>`}

  function sendOtp(){const email=document.getElementById('histEmail').value.trim(),b=document.getElementById('sendOtpBtn');setMsg('historyMsg','','');document.getElementById('historyResults').innerHTML='';if(!email){setMsg('historyMsg','Please enter your email address.','err');return}b.disabled=true;b.textContent='Sending...';gs('requestMySubmissionsOtp',[email],r=>{b.disabled=false;b.textContent='Send Verification Code';document.getElementById('otpEmailLabel').textContent=email;document.getElementById('otpRequestStep').classList.remove('active');document.getElementById('otpVerifyStep').classList.add('active');document.getElementById('histOtp').value='';document.getElementById('histOtp').focus();setMsg('historyMsg',r.message||'Verification code sent.','ok')},e=>{b.disabled=false;b.textContent='Send Verification Code';setMsg('historyMsg',e.message||String(e),'err')})}
  function verifyOtp(){const email=document.getElementById('histEmail').value.trim(),otp=document.getElementById('histOtp').value.trim(),b=document.getElementById('verifyOtpBtn');setMsg('historyMsg','','');b.disabled=true;b.textContent='Verifying...';gs('verifyMySubmissionsOtp',[email,otp],r=>{sessionStorage.setItem(SESSION_STORAGE_KEY,r.sessionToken);sessionStorage.setItem(SESSION_EXPIRY_KEY,r.expiresAt);b.disabled=false;b.textContent='Verify & View My Submissions';showActiveSession(r.expiresAt);loadHistoryWithSession(r.sessionToken)},e=>{b.disabled=false;b.textContent='Verify & View My Submissions';setMsg('historyMsg',e.message||String(e),'err')})}
  function loadHistoryWithSession(token){document.getElementById('historyResults').innerHTML='<div class="privacy">Loading submissions...</div>';gs('getMySubmissionsBySession',[token],rows=>{document.getElementById('historyResults').innerHTML='';if(!rows.length){setMsg('historyMsg','No identified submissions were found.','err');return}setMsg('historyMsg',`${rows.length} submission${rows.length===1?'':'s'} found.`,'ok');document.getElementById('historyResults').innerHTML=rows.map(renderRecord).join('')},e=>{clearLocalSession();showOtpRequest();document.getElementById('historyResults').innerHTML='';setMsg('historyMsg',e.message||String(e),'err')})}
  function restoreHistorySession(){const token=sessionStorage.getItem(SESSION_STORAGE_KEY),expiry=sessionStorage.getItem(SESSION_EXPIRY_KEY);if(!token||!expiry||Date.now()>=new Date(expiry).getTime()){clearLocalSession();showOtpRequest();return}showActiveSession(expiry);loadHistoryWithSession(token)}
  function showActiveSession(expiry){document.getElementById('otpRequestStep').classList.remove('active');document.getElementById('otpVerifyStep').classList.remove('active');document.getElementById('sessionBar').classList.add('show');document.getElementById('sessionExpiryText').textContent='Access expires at '+fmt(expiry)+'.'}
  function showOtpRequest(){document.getElementById('sessionBar').classList.remove('show');document.getElementById('otpVerifyStep').classList.remove('active');document.getElementById('otpRequestStep').classList.add('active')}
  function backToEmail(){document.getElementById('histOtp').value='';setMsg('historyMsg','','');document.getElementById('historyResults').innerHTML='';showOtpRequest()}
  function clearLocalSession(){sessionStorage.removeItem(SESSION_STORAGE_KEY);sessionStorage.removeItem(SESSION_EXPIRY_KEY)}
  function signOutHistory(){const token=sessionStorage.getItem(SESSION_STORAGE_KEY);clearLocalSession();document.getElementById('historyResults').innerHTML='';setMsg('historyMsg','Session ended.','ok');showOtpRequest();if(token)gs('endMySubmissionsSession',[token],()=>{})}
  function trackAnon(){const b=document.getElementById('anonBtn');setMsg('anonMsg','','');document.getElementById('anonResult').innerHTML='';b.disabled=true;b.textContent='Checking...';gs('trackAnonymous',[document.getElementById('anonRef').value,document.getElementById('anonToken').value],r=>{b.disabled=false;b.textContent='Track Observation';setMsg('anonMsg','Observation found.','ok');document.getElementById('anonResult').innerHTML=renderRecord(r)},e=>{b.disabled=false;b.textContent='Track Observation';setMsg('anonMsg',e.message||String(e),'err')})}

  /* Admin */
  function adminToken(){return sessionStorage.getItem(ADMIN_SESSION_KEY)||''}
  function adminSendOtp(){const email=document.getElementById('adminEmail').value.trim(),b=document.getElementById('adminSendBtn');if(!email){setMsg('adminLoginMsg','Enter an admin email.','err');return}b.disabled=true;b.textContent='Sending...';gs('adminRequestOtp',[email],r=>{b.disabled=false;b.textContent='Send Admin OTP';document.getElementById('adminEmailStep').classList.remove('active');document.getElementById('adminOtpStep').classList.add('active');setMsg('adminLoginMsg',r.message,'ok')},e=>{b.disabled=false;b.textContent='Send Admin OTP';setMsg('adminLoginMsg',e.message||String(e),'err')})}
  function adminVerify(){const email=document.getElementById('adminEmail').value.trim(),otp=document.getElementById('adminOtp').value.trim(),b=document.getElementById('adminVerifyBtn');b.disabled=true;b.textContent='Verifying...';gs('adminVerifyOtp',[email,otp],r=>{sessionStorage.setItem(ADMIN_SESSION_KEY,r.sessionToken);sessionStorage.setItem(ADMIN_EXPIRY_KEY,r.expiresAt);b.disabled=false;b.textContent='Verify & Open Dashboard';showAdminShell(r.admin,r.expiresAt);loadAdminDashboard()},e=>{b.disabled=false;b.textContent='Verify & Open Dashboard';setMsg('adminLoginMsg',e.message||String(e),'err')})}
  function adminBackEmail(){document.getElementById('adminOtpStep').classList.remove('active');document.getElementById('adminEmailStep').classList.add('active');document.getElementById('adminOtp').value='';setMsg('adminLoginMsg','','')}
  function restoreAdminSession(){const t=adminToken(),exp=sessionStorage.getItem(ADMIN_EXPIRY_KEY);if(!t||!exp||Date.now()>=new Date(exp).getTime()){clearAdminSession();showAdminLogin();return}showAdminShell({email:'Verified administrator',name:'Admin/HSE',role:'ADMIN'},exp);loadAdminDashboard()}
  function showAdminLogin(){document.getElementById('adminLogin').style.display='block';document.getElementById('adminShell').classList.remove('show')}
  function showAdminShell(admin,expiry){document.getElementById('adminLogin').style.display='none';document.getElementById('adminShell').classList.add('show');document.getElementById('adminIdentity').textContent=(admin.name||'Admin/HSE')+' · '+(admin.email||'')+' · session expires '+fmt(expiry)}
  function clearAdminSession(){sessionStorage.removeItem(ADMIN_SESSION_KEY);sessionStorage.removeItem(ADMIN_EXPIRY_KEY)}
  function adminLogout(){const t=adminToken();clearAdminSession();if(t)gs('adminEndSession',[t],()=>{});showAdminLogin();setMsg('adminLoginMsg','Admin session ended.','ok')}
  function adminFail(e,id='dashMsg'){const msg=e.message||String(e);if(/session/i.test(msg)){clearAdminSession();showAdminLogin();setMsg('adminLoginMsg',msg,'err')}else setMsg(id,msg,'err')}

  function switchAdminPage(page,btn){document.querySelectorAll('.adminPage').forEach(x=>x.classList.remove('active'));document.getElementById('admin-'+page).classList.add('active');document.querySelectorAll('.adminNav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');else{const b=document.querySelector(`.adminNav button[data-adminpage="${page}"]`);if(b)b.classList.add('active')}if(page==='dashboard')loadAdminDashboard();if(page==='observations')loadAdminObservations();if(page==='recognition')loadRecognitionPage();if(page==='surveys')loadCustomerSurveys();if(page==='audit')loadAudit();if(page==='share')loadShareInfo()}

  function loadAdminDashboard(){const month=document.getElementById('dashMonth').value||currentMonth();setMsg('dashMsg','','');gs('adminGetDashboard',[adminToken(),month],d=>{document.getElementById('adminIdentity').textContent=(d.admin.name||'Admin/HSE')+' · '+d.admin.email;document.getElementById('metricGrid').innerHTML=[['TOTAL OBSERVATIONS',d.total],['SAFE ACTS',d.safeActs],['UNSAFE ACTS',d.unsafeActs],['CONTRIBUTORS',d.contributors]].map(x=>`<div class="metric"><div class="n">${x[1]}</div><div class="l">${x[0]}</div></div>`).join('');renderBars('typeChart',d.byType);renderRank('topContrib',d.topContributors.map((x,i)=>({label:x.name+(x.company?' · '+x.company:''),count:x.count})));renderRank('topLocations',d.topLocations);renderRecognition('dashRecognition',d.recognition)},e=>adminFail(e,'dashMsg'))}
  function renderBars(id,map){const vals=Object.entries(map||{}).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...vals.map(x=>x[1])),total=Math.max(1,vals.reduce((s,x)=>s+x[1],0));document.getElementById(id).innerHTML=vals.length?vals.map(([k,v])=>`<div class="barRow"><div>${esc(k)}</div><div class="barTrack"><div class="barFill" style="width:${Math.round(v/max*100)}%"></div></div><strong>${v}</strong></div><div class="meta" style="text-align:right;margin-top:-5px;margin-bottom:6px">${Math.round(v/total*100)}%</div>`).join(''):'<div class="empty">No data for this month.</div>'}
  function renderRank(id,rows){document.getElementById(id).innerHTML=rows&&rows.length?rows.map((x,i)=>`<div class="rank"><div class="pos">${i+1}</div><div>${esc(x.label)}</div><div class="cnt">${x.count}</div></div>`).join(''):'<div class="empty">No data for this month.</div>'}
  function renderRecognition(id,rows){document.getElementById(id).innerHTML=rows&&rows.length?rows.map(x=>`<div class="record"><strong>${esc(x.category)}</strong><div>${esc(x.reference)}</div>${x.notes?`<div class="detail">${esc(x.notes)}</div>`:''}</div>`).join(''):'<div class="empty">No recognition selected yet.</div>'}

  function loadAdminObservations(){const f={query:document.getElementById('obsQuery').value,month:document.getElementById('obsMonth').value||currentMonth(),type:document.getElementById('obsType').value};setMsg('obsMsg','','');document.getElementById('obsList').innerHTML='<div class="privacy">Loading...</div>';gs('adminListObservations',[adminToken(),f],r=>{setMsg('obsMsg',`${r.items.length} observation${r.items.length===1?'':'s'} found.`,'ok');if(!r.items.length){document.getElementById('obsList').innerHTML='<div class="empty">No matching observations.</div>';return}document.getElementById('obsList').innerHTML=`<table class="obsTable"><thead><tr><th>Reference / Date</th><th>Type</th><th>Submitter</th><th>Location</th></tr></thead><tbody>${r.items.map(x=>`<tr class="clickable" onclick="openAdminReview('${esc(x.reference)}')"><td><strong>${esc(x.reference)}</strong><br><span class="meta">Observed: ${fmt(x.observationDateTime||x.submittedAt)}</span><br><span class="meta">Submitted: ${fmt(x.submittedAt)}</span></td><td>${esc(x.observationType)}</td><td>${esc(x.name)}<br><span class="meta">${esc(x.company)}</span></td><td>${esc(x.location)}</td></tr>`).join('')}</tbody></table>`},e=>{document.getElementById('obsList').innerHTML='';adminFail(e,'obsMsg')})}

  function openAdminReview(ref){currentReviewRef=ref;switchAdminPage('review');setMsg('reviewMsg','','');document.getElementById('reviewContent').innerHTML='<div class="privacy">Loading observation...</div>';gs('adminGetObservation',[adminToken(),ref],renderReview,e=>adminFail(e,'reviewMsg'))}
  function renderReview(r){
    currentReviewRef=r.reference;
    const rec=(r.recognition||[]).map(x=>`<span class="recognitionTag">${esc(x.category)}</span>`).join('');
    document.getElementById('reviewContent').innerHTML=`<div class="reviewGrid">
      <div class="reviewBox">
        <h3>${esc(r.reference)}</h3>
        <div class="kv">
          <div class="k">Observed</div><div>${fmt(r.observationDateTime||r.submittedAt)}</div>
          <div class="k">Submitted</div><div>${fmt(r.submittedAt)}</div>
          <div class="k">Name</div><div>${esc(r.name)}</div>
          <div class="k">Email</div><div>${esc(r.email)}</div>
          <div class="k">Company</div><div>${esc(r.company)}</div>
          <div class="k">Type</div><div>${esc(r.observationType)}</div>
          <div class="k">Location</div><div>${esc(r.location)}</div>
          <div class="k">Photo</div><div>${r.photoFileId?'Attached securely':'None'}</div>
        </div>
        <p><strong>Observation</strong><br>${esc(r.observation)}</p>
        <p><strong>Immediate action</strong><br>${esc(r.actionTaken||'—')}</p>
      </div>
      <div class="reviewBox">
        <h3>Record Administration</h3>
        <div class="secureNote"><strong>Record only:</strong> this UCUA does not require OPEN / IN PROGRESS / CLOSED status or future HSE follow-up.</div>
        <h3>Recognition</h3>
        <div>${rec||'<span class="meta">No recognition yet.</span>'}</div>
        <label style="margin-top:12px">Category</label>
        <select id="revRecognition"><option>Shortlisted</option><option>Best UCUA</option><option>Best Safe Observation</option><option>Best Safety Intervention</option></select>
        <label style="margin-top:12px">Recognition Notes</label>
        <input id="revRecNotes" placeholder="Why was this selected?">
        <div class="actions"><button class="btn gold" onclick="setRecognition()">Apply Recognition</button><button class="btn secondary" onclick="removeRecognition()">Remove Selected Category</button></div>
        <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
        <h3>Delete Record</h3>
        <div class="privacy">Deletion requires a written reason. The original record remains preserved for audit traceability.</div>
        <div class="actions"><button class="btn danger" onclick="deleteCurrentObservation()">Delete Submission</button></div>
      </div>
    </div>`;
  }

  function deleteCurrentObservation(){
    if(!currentReviewRef)return;
    const reason=prompt('Enter the reason for deleting '+currentReviewRef+'.\n\nThis is a soft delete: the record remains in the audit trail but is removed from normal reports and user history.');
    if(reason===null)return;
    if(reason.trim().length<10){setMsg('reviewMsg','Deletion reason must be at least 10 characters.','err');return}
    if(!confirm('Delete '+currentReviewRef+' from active UCUA records?\n\nReason: '+reason.trim()))return;
    gs('adminDeleteObservation',[adminToken(),currentReviewRef,reason.trim()],r=>{
      switchAdminPage('observations');
      setMsg('obsMsg',r.reference+' deleted. The reason has been recorded in the audit log.','ok');
      loadAdminObservations();
      loadAdminDashboard();
    },e=>adminFail(e,'reviewMsg'));
  }

  function setRecognition(){const c=document.getElementById('revRecognition').value,n=document.getElementById('revRecNotes').value;gs('adminSetRecognition',[adminToken(),currentReviewRef,c,n],r=>{setMsg('reviewMsg','Recognition updated. '+(r.notificationStatus||r.smsStatus||''),'ok');openAdminReview(currentReviewRef)},e=>adminFail(e,'reviewMsg'))}
  function removeRecognition(){const c=document.getElementById('revRecognition').value;gs('adminRemoveRecognition',[adminToken(),currentReviewRef,c],r=>{setMsg('reviewMsg','Recognition removed.','ok');openAdminReview(currentReviewRef)},e=>adminFail(e,'reviewMsg'))}

  function loadRecognitionPage(){const month=document.getElementById('recMonth').value||currentMonth();gs('adminGetDashboard',[adminToken(),month],d=>{let h='<h4>Selected Recognition</h4>';h+=d.recognition.length?d.recognition.map(x=>`<div class="record"><strong>${esc(x.category)}</strong> — ${esc(x.reference)}${x.notes?`<div class="detail">${esc(x.notes)}</div>`:''}</div>`).join(''):'<div class="empty">No recognition selected yet.</div>';h+='<h4 style="margin-top:18px">Top Contributors</h4>';h+=d.topContributors.length?d.topContributors.map((x,i)=>`<div class="rank"><div class="pos">${i+1}</div><div>${esc(x.name)}${x.company?' · '+esc(x.company):''}</div><div class="cnt">${x.count}</div></div>`).join(''):'<div class="empty">No contributors this month.</div>';document.getElementById('recPage').innerHTML=h},e=>adminFail(e,'dashMsg'))}

  function renderSurveySectionBars(id,map){const vals=Object.entries(map||{});document.getElementById(id).innerHTML=vals.length?vals.map(([k,v])=>`<div class="barRow"><div>${esc(k)}</div><div class="barTrack"><div class="barFill" style="width:${Math.max(0,Math.min(100,Number(v)/5*100))}%"></div></div><strong>${Number(v).toFixed(2)}</strong></div><div class="meta" style="text-align:right;margin-top:-5px;margin-bottom:6px">${(Number(v)/5*100).toFixed(1)}%</div>`).join(''):'<div class="empty">No survey data for this month.</div>'}

  function loadCustomerSurveys(){
    const month=document.getElementById('surveyMonth').value||currentMonth();setMsg('surveyAdminMsg','','');document.getElementById('surveyResponses').innerHTML='<div class="privacy">Loading surveys...</div>';
    gs('adminGetCustomerSurveys',[adminToken(),month],d=>{
      document.getElementById('surveyMetricGrid').innerHTML=[['RESPONSES',d.count],['AVG SCORE',Number(d.overallAverage).toFixed(2)+' / 5'],['SATISFACTION',Number(d.percentage).toFixed(1)+'%']].map(x=>`<div class="surveyMetric"><div class="n">${x[1]}</div><div class="l">${x[0]}</div></div>`).join('');
      renderSurveySectionBars('surveySectionChart',{'Timeliness & Reliability':d.sections.timeliness,'Quality':d.sections.quality,'Responsiveness':d.sections.responsiveness,'Communication':d.sections.communication});
      document.getElementById('surveyResponses').innerHTML=d.items.length?d.items.map(x=>`<div class="record"><div class="recordtop"><div><h4>${esc(x.reference)} · ${esc(x.customerName)}</h4><div class="meta">${esc(x.company)} · ${esc(x.location)} · ${fmt(x.surveyDate)}</div></div><strong>${Number(x.overallAverage).toFixed(2)}/5</strong></div><div class="detail surveyDetails"><div><strong>Email:</strong> ${esc(x.email||'—')}</div><div><strong>Equipment ID On-Site:</strong> ${esc(x.equipmentOnSite||'—')}</div><div><strong>Crew On-Site:</strong> ${esc(x.crewOnSite||'—')}</div><div><strong>Satisfaction:</strong> ${Number(x.percentage).toFixed(1)}%</div></div>${x.comments?`<p><strong>Comments</strong><br>${esc(x.comments)}</p>`:''}<div class="actions"><button class="btn danger" onclick="deleteCustomerSurvey('${esc(x.reference)}')">Delete Response</button></div></div>`).join(''):'<div class="empty">No customer surveys for this month.</div>';
      setMsg('surveyAdminMsg',d.count+' customer survey'+(d.count===1?'':'s')+' found.','ok');
    },e=>adminFail(e,'surveyAdminMsg'));
  }

  function deleteCustomerSurvey(reference){
    const reason=prompt('Enter the reason for deleting '+reference+'.\n\nThe response will be removed from survey analytics but retained in the audit trail.');
    if(reason===null)return;
    const clean=reason.trim();
    if(clean.length<10){setMsg('surveyAdminMsg','Deletion reason must be at least 10 characters.','err');return}
    if(!confirm('Delete '+reference+' from active Customer Survey records?\n\nReason: '+clean))return;
    gs('adminDeleteCustomerSurvey',[adminToken(),reference,clean],r=>{
      setMsg('surveyAdminMsg',r.reference+' deleted. The reason has been recorded in the audit log.','ok');
      loadCustomerSurveys();
    },e=>adminFail(e,'surveyAdminMsg'));
  }

  function downloadCustomerSurveyCsv(){const month=document.getElementById('surveyMonth').value||currentMonth();gs('adminGetCustomerSurveyCsv',[adminToken(),month],r=>{const blob=new Blob([r.csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=r.filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)},e=>adminFail(e,'surveyAdminMsg'))}

  function loadAudit(){document.getElementById('auditList').innerHTML='<div class="privacy">Loading...</div>';gs('adminGetAuditLog',[adminToken(),100],rows=>{document.getElementById('auditList').innerHTML=rows.length?rows.map(x=>`<div class="auditRow"><strong>${esc(x.action)}</strong> ${x.reference?`· ${esc(x.reference)}`:''}<div class="meta">${fmt(x.timestamp)} · ${esc(x.adminEmail)}</div>${x.details?`<div>${esc(x.details)}</div>`:''}</div>`).join(''):'<div class="empty">No admin actions yet.</div>'},e=>adminFail(e,'auditMsg'))}
  function downloadMonthlyCsv(){const month=document.getElementById('dashMonth').value||currentMonth();gs('adminGetMonthlyReportCsv',[adminToken(),month],r=>{const blob=new Blob([r.csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=r.filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)},e=>adminFail(e,'dashMsg'))}


  let currentShareUrl='';

  function loadShareInfo(){
    document.getElementById('ucuaQr').innerHTML='<div class="meta">Generating QR...</div>';
    setMsg('shareMsg','','');
    gs('adminGetShareInfo',[adminToken()],r=>{
      currentShareUrl=r.url||'';
      document.getElementById('shareUrlLabel').textContent=r.label||'Public UCUA Web App URL';
      document.getElementById('shareUrl').textContent=currentShareUrl||'Unable to determine URL.';
      document.getElementById('ucuaQr').innerHTML='';

      if(!currentShareUrl){
        setMsg('shareMsg','Unable to determine the production portal URL.','err');
        return;
      }

      if(r.isDevelopmentUrl){
        setMsg('shareMsg','This is not the production portal URL. Open the production Vercel deployment before distributing the QR.','err');
      }else{
        setMsg('shareMsg','QR code generated for the current deployed public UCUA URL.','ok');
      }

      if(typeof QRCode==='undefined'){
        document.getElementById('ucuaQr').innerHTML='<div class="meta">QR library could not load. Check internet access and refresh.</div>';
        return;
      }

      new QRCode(document.getElementById('ucuaQr'),{
        text:currentShareUrl,
        width:200,
        height:200,
        correctLevel:QRCode.CorrectLevel.H
      });
    },e=>adminFail(e,'shareMsg'));
  }

  function copyShareUrl(){
    if(!currentShareUrl){setMsg('shareMsg','No public URL is loaded yet.','err');return}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(currentShareUrl).then(()=>setMsg('shareMsg','Public UCUA link copied to clipboard.','ok')).catch(()=>fallbackCopyShareUrl());
    }else fallbackCopyShareUrl();
  }

  function fallbackCopyShareUrl(){
    const ta=document.createElement('textarea');
    ta.value=currentShareUrl;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');setMsg('shareMsg','Public UCUA link copied to clipboard.','ok')}
    catch(e){setMsg('shareMsg','Could not copy automatically. Select the displayed URL and copy it manually.','err')}
    ta.remove();
  }

  function downloadShareQr(){
    if(!currentShareUrl){setMsg('shareMsg','No QR code is loaded yet.','err');return}
    const box=document.getElementById('ucuaQr');
    const canvas=box.querySelector('canvas');
    const img=box.querySelector('img');

    let dataUrl='';
    if(canvas) dataUrl=canvas.toDataURL('image/png');
    else if(img) dataUrl=img.src;

    if(!dataUrl){setMsg('shareMsg','QR image is not ready yet.','err');return}

    const a=document.createElement('a');
    a.href=dataUrl;
    a.download='UCUA_Public_QR_Code.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg('shareMsg','QR PNG prepared for download.','ok');
  }



  function titleCaseValue(value){
    return String(value||'').toLowerCase().replace(/(^|[\s\-\/(])([a-z\u00c0-\u024f])/g,(m,p,c)=>p+c.toUpperCase());
  }
  function shouldAutoTitleCase(el){
    if(!el)return false;
    const tag=(el.tagName||'').toUpperCase();
    if(tag!=='INPUT' && tag!=='TEXTAREA')return false;
    const type=(el.type||'text').toLowerCase();
    if(tag==='INPUT' && !['text','search'].includes(type))return false;
    if(el.dataset.noTitlecase==='1')return false;
    const id=(el.id||'').toLowerCase();
    if(/email|phone|otp|token|reference|ref|pin|code|equipment|search|query|date|time|month/.test(id))return false;
    return true;
  }
  function applyTitleCaseToElement(el){
    if(!shouldAutoTitleCase(el))return;
    const before=el.value, after=titleCaseValue(before);
    if(before===after)return;
    const start=typeof el.selectionStart==='number'?el.selectionStart:null;
    const end=typeof el.selectionEnd==='number'?el.selectionEnd:null;
    el.value=after;
    if(start!==null && document.activeElement===el){try{el.setSelectionRange(start,end)}catch(_){}}
  }
  document.addEventListener('input',e=>{if(shouldAutoTitleCase(e.target))applyTitleCaseToElement(e.target)});
  document.addEventListener('blur',e=>{if(shouldAutoTitleCase(e.target))applyTitleCaseToElement(e.target)},true);

  showPortalHome();


/* ---- migrated inline script ---- */


    document.addEventListener('DOMContentLoaded', function(){
      var logo=document.querySelector('.brandLogo');
      var wm=document.querySelector('.menuWatermark');
      if(logo && wm) wm.style.backgroundImage='url("'+logo.src+'")';
    });
  

/* ---- migrated inline script ---- */


function toggleOtherCompany(){
  const company = document.getElementById('company');
  const wrap = document.getElementById('otherCompanyWrap');
  const other = document.getElementById('otherCompany');
  if (!company || !wrap || !other) return;

  const isOther = company.value === 'OTHERS' || company.dataset.otherActive === '1';
  wrap.style.display = isOther ? 'block' : 'none';
  other.required = isOther;

  if (!isOther) {
    other.value = '';
    company.dataset.otherActive = '0';
    const custom = company.querySelector('option[data-custom-company="1"]');
    if (custom) custom.remove();
  }
}

document.addEventListener('input', function(e){
  if (e.target && e.target.id === 'otherCompany') {
    const company = document.getElementById('company');
    if (!company) return;
    const text = e.target.value.trim();

    let custom = company.querySelector('option[data-custom-company="1"]');
    if (!custom) {
      custom = document.createElement('option');
      custom.dataset.customCompany = '1';
      company.appendChild(custom);
    }
    custom.value = text || 'OTHERS';
    custom.textContent = text || 'OTHERS';
    custom.selected = true;
    company.dataset.otherActive = '1';
  }
});

document.addEventListener('DOMContentLoaded', toggleOtherCompany);
