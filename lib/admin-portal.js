import { getSupabaseAdmin } from './supabase.js';
import { requireAdminSession } from './admin-auth.js';

function monthKey(v){ const s=String(v||'').trim(); if(!/^\d{4}-\d{2}$/.test(s)) throw new Error('A valid reporting month is required.'); return s; }
function csv(v){ const s=String(v??''); return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function ranked(map,n=10){ return [...map.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).slice(0,n); }
function obsRecord(r){ return { reference:r.reference_no, submittedAt:r.submitted_at, observationDateTime:r.observation_datetime, name:r.submitter_name||'', email:r.submitter_email||'',  company:r.company||'', observationType:r.observation_type||'', location:r.location||'', observation:r.observation||'', actionTaken:r.action_taken||'', photoFileId:r.photo_storage_path||r.photo_url||'', deleted:!!r.deleted }; }
async function audit(admin, reference, action, fromStatus='', toStatus='', details='') { const db=getSupabaseAdmin(); await db.from('admin_audit_log').insert({admin_id:admin.id,admin_email:admin.email,reference_no:reference||null,action,from_status:fromStatus||null,to_status:toStatus||null,details:details||null}); }
async function activeObservations(month){ const db=getSupabaseAdmin(); const start=`${month}-01`; const [y,m]=month.split('-').map(Number); const end=`${m===12?y+1:y}-${String(m===12?1:m+1).padStart(2,'0')}-01`; const {data,error}=await db.from('observations').select('*').eq('deleted',false).gte('observation_datetime',start).lt('observation_datetime',end); if(error) throw new Error(`Unable to load observations: ${error.message}`); return data||[]; }
async function recognitionForMonth(month){ const db=getSupabaseAdmin(); const {data,error}=await db.from('recognition').select('reference_no,category,notes,created_at').eq('month_key',month).order('created_at',{ascending:false}); if(error) throw new Error(`Unable to load recognition: ${error.message}`); return (data||[]).map(x=>({reference:x.reference_no,category:x.category,notes:x.notes||'',createdAt:x.created_at})); }
async function recognitionForReference(reference){ const db=getSupabaseAdmin(); const {data,error}=await db.from('recognition').select('reference_no,category,notes,created_at').eq('reference_no',reference).order('created_at',{ascending:false}); if(error) throw new Error(`Unable to load recognition: ${error.message}`); return (data||[]).map(x=>({reference:x.reference_no,category:x.category,notes:x.notes||'',createdAt:x.created_at})); }

export async function adminGetDashboard(token, monthInput){ const admin=await requireAdminSession(token); const month=monthKey(monthInput); const rows=await activeObservations(month); const byType=new Map(), byLocation=new Map(), byCompany=new Map(), contributors=new Map(); for(const r of rows){ const type=r.observation_type||'Unspecified', loc=r.location||'Unspecified', company=r.company||'Unspecified'; byType.set(type,(byType.get(type)||0)+1); byLocation.set(loc,(byLocation.get(loc)||0)+1); byCompany.set(company,(byCompany.get(company)||0)+1); if(!r.is_anonymous && r.submitter_email){ const key=r.submitter_email.toLowerCase(); const c=contributors.get(key)||{email:key,name:r.submitter_name||key,company:r.company||'',count:0}; c.count++; contributors.set(key,c); }} const types=Object.fromEntries(byType); return {ok:true,admin:{email:admin.email,name:admin.displayName||'Admin/HSE',role:admin.role},month,total:rows.length,safeActs:types['Safe Act']||0,unsafeActs:types['Unsafe Act']||0,contributors:contributors.size,byType:types,topContributors:[...contributors.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,10),topLocations:ranked(byLocation),topCompanies:ranked(byCompany),recognition:await recognitionForMonth(month)}; }

export async function adminListObservations(token, filters={}){ await requireAdminSession(token); const month=monthKey(filters.month); let rows=await activeObservations(month); const q=String(filters.query||'').trim().toLowerCase(), type=String(filters.type||'').trim(); rows=rows.filter(r=>!type||r.observation_type===type).filter(r=>!q||[r.reference_no,r.submitter_name,r.submitter_email,r.company,r.observation_type,r.location,r.observation,r.action_taken].join(' ').toLowerCase().includes(q)); return {ok:true,items:rows.map(obsRecord).sort((a,b)=>new Date(b.observationDateTime||b.submittedAt)-new Date(a.observationDateTime||a.submittedAt))}; }
export async function adminGetObservation(token, referenceInput){ await requireAdminSession(token); const reference=String(referenceInput||'').trim().toUpperCase(); const db=getSupabaseAdmin(); const {data,error}=await db.from('observations').select('*').eq('reference_no',reference).maybeSingle(); if(error) throw new Error(`Unable to load observation: ${error.message}`); if(!data) throw new Error('Observation not found.'); const r=obsRecord(data); r.recognition=await recognitionForReference(reference); return r; }
export async function adminDeleteObservation(token, referenceInput, reasonInput){ const admin=await requireAdminSession(token); const reference=String(referenceInput||'').trim().toUpperCase(), reason=String(reasonInput||'').trim(); if(reason.length<10) throw new Error('Please provide a clear deletion reason of at least 10 characters.'); const db=getSupabaseAdmin(); const {data,error}=await db.from('observations').update({deleted:true,deleted_at:new Date().toISOString(),deleted_by:admin.id,delete_reason:reason}).eq('reference_no',reference).eq('deleted',false).select('reference_no').maybeSingle(); if(error) throw new Error(`Unable to delete observation: ${error.message}`); if(!data) throw new Error('Observation not found or already deleted.'); await db.from('recognition').delete().eq('reference_no',reference); await audit(admin,reference,'DELETE OBSERVATION','','DELETED',`Reason: ${reason}`); return {ok:true,reference}; }
export async function adminGetMonthlyReportCsv(token, monthInput){ await requireAdminSession(token); const month=monthKey(monthInput), rows=await activeObservations(month); const headers=['Observation Date/Time','Submitted At','Reference','Name','Email','Company','Observation Type','Location','Observation','Immediate Action Taken']; const out=[headers,...rows.map(r=>[r.observation_datetime,r.submitted_at,r.reference_no,r.submitter_name,r.submitter_email,r.company,r.observation_type,r.location,r.observation,r.action_taken])]; return {ok:true,filename:`UCUA_Monthly_Report_${month}.csv`,csv:out.map(row=>row.map(csv).join(',')).join('\r\n')}; }
export async function adminGetAuditLog(token, limitInput){ await requireAdminSession(token); const limit=Math.max(1,Math.min(Number(limitInput||100),500)); const db=getSupabaseAdmin(); const {data,error}=await db.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(limit); if(error) throw new Error(`Unable to load audit log: ${error.message}`); return (data||[]).map(r=>({timestamp:r.created_at,adminEmail:r.admin_email||'',reference:r.reference_no||'',action:r.action||'',fromStatus:r.from_status||'',toStatus:r.to_status||'',details:r.details||''})); }
export async function adminSetRecognition(token, referenceInput, categoryInput, notesInput){ const admin=await requireAdminSession(token); const reference=String(referenceInput||'').trim().toUpperCase(), category=String(categoryInput||'').trim(), notes=String(notesInput||'').trim(); const allowed=['Shortlisted','Best UCUA','Best Safe Observation','Best Safety Intervention']; if(!allowed.includes(category)) throw new Error('Invalid recognition category.'); const db=getSupabaseAdmin(); const {data:obs,error:oe}=await db.from('observations').select('reference_no,observation_datetime,deleted').eq('reference_no',reference).maybeSingle(); if(oe) throw new Error(oe.message); if(!obs||obs.deleted) throw new Error('Observation not found or deleted.'); const month=String(obs.observation_datetime).slice(0,7); if(category!=='Shortlisted') await db.from('recognition').delete().eq('month_key',month).eq('category',category); await db.from('recognition').delete().eq('reference_no',reference).eq('category',category); const {error}=await db.from('recognition').insert({month_key:month,reference_no:reference,category,notes:notes||null,selected_by:admin.id,selected_by_email:admin.email}); if(error) throw new Error(`Unable to save recognition: ${error.message}`); await audit(admin,reference,'RECOGNITION','',category,notes||category); return {ok:true,recognition:await recognitionForReference(reference),notificationStatus:'Recognition saved. Email notification is not configured yet.'}; }
export async function adminRemoveRecognition(token, referenceInput, categoryInput){ const admin=await requireAdminSession(token); const reference=String(referenceInput||'').trim().toUpperCase(), category=String(categoryInput||'').trim(); const db=getSupabaseAdmin(); let q=db.from('recognition').delete().eq('reference_no',reference); if(category) q=q.eq('category',category); const {error}=await q; if(error) throw new Error(`Unable to remove recognition: ${error.message}`); await audit(admin,reference,'REMOVE RECOGNITION',category,'','Recognition removed.'); return {ok:true,recognition:await recognitionForReference(reference)}; }
export async function adminGetShareInfo(token){ await requireAdminSession(token); return {ok:true,url:'https://dpi-customer-experience-portal.vercel.app',isDevelopmentUrl:false,label:'Public DPI Customer Experience Portal URL'}; }

export async function adminGetCustomerSurveys(token, monthInput){ await requireAdminSession(token); const month=monthKey(monthInput); const start=`${month}-01`; const [y,m]=month.split('-').map(Number); const end=`${m===12?y+1:y}-${String(m===12?1:m+1).padStart(2,'0')}-01`; const db=getSupabaseAdmin(); const {data,error}=await db.from('customer_surveys').select('*').eq('deleted',false).gte('survey_date',start).lt('survey_date',end).order('submitted_at',{ascending:false}); if(error) throw new Error(`Unable to load customer surveys: ${error.message}`); const items=(data||[]).map(r=>({submittedAt:r.submitted_at,reference:r.reference_no,customerName:r.customer_name,company:r.customer_company||'',location:r.location||'',surveyDate:r.survey_date,avgA:Number(r.avg_a||0),avgB:Number(r.avg_b||0),avgC:Number(r.avg_c||0),avgD:Number(r.avg_d||0),comments:r.comments||'',overallAverage:Number(r.overall_average||0),percentage:Number(r.overall_percentage||0),email:r.customer_email||'',equipmentOnSite:r.equipment_on_site||'',crewOnSite:r.crew_on_site||''})); const avg=k=>items.length?items.reduce((s,x)=>s+Number(x[k]||0),0)/items.length:0; const overall=avg('overallAverage'); return {ok:true,month,count:items.length,overallAverage:+overall.toFixed(2),percentage:+(overall/5*100).toFixed(1),sections:{timeliness:+avg('avgA').toFixed(2),quality:+avg('avgB').toFixed(2),responsiveness:+avg('avgC').toFixed(2),communication:+avg('avgD').toFixed(2)},items}; }
export async function adminDeleteCustomerSurvey(token, referenceInput, reasonInput){ const admin=await requireAdminSession(token); const reference=String(referenceInput||'').trim().toUpperCase(), reason=String(reasonInput||'').trim(); if(reason.length<10) throw new Error('Please provide a clear deletion reason of at least 10 characters.'); const db=getSupabaseAdmin(); const {data,error}=await db.from('customer_surveys').update({deleted:true,deleted_at:new Date().toISOString(),deleted_by:admin.id,delete_reason:reason}).eq('reference_no',reference).eq('deleted',false).select('reference_no').maybeSingle(); if(error) throw new Error(`Unable to delete customer survey: ${error.message}`); if(!data) throw new Error('Customer survey response not found or already deleted.'); await audit(admin,reference,'DELETE CUSTOMER SURVEY','','DELETED',`Reason: ${reason}`); return {ok:true,reference}; }
export async function adminGetCustomerSurveyCsv(token, monthInput){ const d=await adminGetCustomerSurveys(token,monthInput); const headers=['Submitted At','Reference','Customer Name','Company','Location','Survey Date','Avg A','Avg B','Avg C','Avg D','Comments','Overall Average','Percentage','Email','Equipment ID On-Site','Crew On-Site']; const rows=d.items.map(x=>[x.submittedAt,x.reference,x.customerName,x.company,x.location,x.surveyDate,x.avgA,x.avgB,x.avgC,x.avgD,x.comments,x.overallAverage,x.percentage,x.email,x.equipmentOnSite,x.crewOnSite]); return {ok:true,filename:`DPI_Customer_Satisfaction_${d.month}.csv`,csv:[headers,...rows].map(r=>r.map(csv).join(',')).join('\r\n')}; }


function normalizeAdminEmail(value){ return String(value||'').trim().toLowerCase(); }
function validAdminEmail(value){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export async function adminListAdmins(token){
  const current=await requireAdminSession(token);
  const db=getSupabaseAdmin();
  const {data,error}=await db.from('admins').select('id,email,display_name,role,is_active,created_at').order('is_active',{ascending:false}).order('email',{ascending:true});
  if(error) throw new Error(`Unable to load administrators: ${error.message}`);
  return {ok:true,currentAdminId:current.id,items:(data||[]).map(r=>({id:r.id,email:r.email,displayName:r.display_name||'',role:r.role||'admin',isActive:!!r.is_active,createdAt:r.created_at||null,isCurrent:r.id===current.id}))};
}

export async function adminAddAdmin(token, input={}){
  const current=await requireAdminSession(token);
  const email=normalizeAdminEmail(input.email), displayName=String(input.displayName||input.name||'').trim();
  if(!displayName) throw new Error('Administrator name is required.');
  if(!validAdminEmail(email)) throw new Error('Enter a valid administrator email address.');
  const db=getSupabaseAdmin();
  const {data:existing,error:lookupError}=await db.from('admins').select('id,email,is_active').ilike('email',email).maybeSingle();
  if(lookupError) throw new Error(`Unable to check administrator: ${lookupError.message}`);
  if(existing){
    if(existing.is_active) throw new Error('This email already has active administrator access.');
    const {error}=await db.from('admins').update({display_name:displayName,is_active:true}).eq('id',existing.id);
    if(error) throw new Error(`Unable to restore administrator access: ${error.message}`);
    await audit(current,null,'ENABLE ADMIN ACCESS','','ACTIVE',`Administrator: ${displayName} <${email}>`);
    return {ok:true,message:'Administrator access restored.'};
  }
  const {error}=await db.from('admins').insert({email,display_name:displayName,role:'admin',is_active:true});
  if(error) throw new Error(`Unable to add administrator: ${error.message}`);
  await audit(current,null,'ADD ADMIN ACCESS','','ACTIVE',`Administrator: ${displayName} <${email}>`);
  return {ok:true,message:'Administrator access added.'};
}

export async function adminSetAdminActive(token, adminIdInput, activeInput){
  const current=await requireAdminSession(token);
  const adminId=String(adminIdInput||'').trim(), makeActive=activeInput===true;
  if(!adminId) throw new Error('Administrator record is required.');
  if(adminId===current.id && !makeActive) throw new Error('You cannot disable your own administrator access.');
  const db=getSupabaseAdmin();
  const {data:target,error:targetError}=await db.from('admins').select('id,email,display_name,is_active').eq('id',adminId).maybeSingle();
  if(targetError) throw new Error(`Unable to load administrator: ${targetError.message}`);
  if(!target) throw new Error('Administrator was not found.');
  if(!!target.is_active===makeActive) return {ok:true,message:makeActive?'Administrator is already active.':'Administrator is already disabled.'};
  if(!makeActive){
    const {count,error:countError}=await db.from('admins').select('id',{count:'exact',head:true}).eq('is_active',true);
    if(countError) throw new Error(`Unable to verify active administrators: ${countError.message}`);
    if((count||0)<=1) throw new Error('The last active administrator cannot be disabled.');
  }
  const {error}=await db.from('admins').update({is_active:makeActive}).eq('id',adminId);
  if(error) throw new Error(`Unable to update administrator access: ${error.message}`);
  await audit(current,null,makeActive?'ENABLE ADMIN ACCESS':'DISABLE ADMIN ACCESS',target.is_active?'ACTIVE':'DISABLED',makeActive?'ACTIVE':'DISABLED',`Administrator: ${target.display_name||''} <${target.email}>`);
  return {ok:true,message:makeActive?'Administrator access enabled.':'Administrator access disabled.'};
}


export async function adminDeleteAdmin(token, adminIdInput){
  const current=await requireAdminSession(token);
  const adminId=String(adminIdInput||'').trim();
  if(!adminId) throw new Error('Administrator record is required.');
  if(adminId===current.id) throw new Error('You cannot delete your own administrator account.');

  const db=getSupabaseAdmin();
  const {data:target,error:targetError}=await db.from('admins').select('id,email,display_name,is_active').eq('id',adminId).maybeSingle();
  if(targetError) throw new Error(`Unable to load administrator: ${targetError.message}`);
  if(!target) throw new Error('Administrator was not found.');
  if(target.is_active) throw new Error('Remove administrator access before permanently deleting this administrator.');

  // Remove the matching Supabase Auth identity when one exists. This is server-side only.
  let authUser=null;
  for(let page=1; page<=20 && !authUser; page++){
    const {data,error}=await db.auth.admin.listUsers({page,perPage:100});
    if(error) throw new Error(`Unable to check Supabase Auth user: ${error.message}`);
    const users=data?.users||[];
    authUser=users.find(u=>normalizeAdminEmail(u.email)===normalizeAdminEmail(target.email))||null;
    if(users.length<100) break;
  }
  if(authUser){
    const {error}=await db.auth.admin.deleteUser(authUser.id);
    if(error) throw new Error(`Unable to delete Supabase Auth user: ${error.message}`);
  }

  const {error:deleteError}=await db.from('admins').delete().eq('id',adminId).eq('is_active',false);
  if(deleteError) throw new Error(`Unable to delete administrator record: ${deleteError.message}`);

  await audit(current,null,'DELETE ADMINISTRATOR','DISABLED','DELETED',`Administrator: ${target.display_name||''} <${target.email}>; Supabase Auth user: ${authUser?'deleted':'not found'}.`);
  return {ok:true,message:'Administrator permanently deleted. Existing Audit Log history has been preserved.'};
}
