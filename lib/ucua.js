import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase.js';

const clean=v=>String(v??'').trim();
const email=v=>clean(v).toLowerCase();
const allowedTypes=new Set(['Safe Act','Unsafe Act','Safe Condition','Unsafe Condition','Good Catch / Near Miss']);
const allowedMimes=new Set(['image/jpeg','image/png','image/webp']);
function authClient(){return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
function publicRecord(r,recognition=[]){return {reference:r.reference_no,submittedAt:r.submitted_at,observationDateTime:r.observation_datetime,observationType:r.observation_type||'',location:r.location||'',observation:r.observation||'',actionTaken:r.action_taken||'',hasPhoto:!!(r.photo_storage_path||r.photo_url),recognition};}
function portalUrl(){return String(process.env.PUBLIC_PORTAL_URL||'https://dpi-customer-experience-portal.vercel.app').replace(/\/$/,'');}
function validateDate(v){const d=new Date(v);if(!v||Number.isNaN(d.getTime()))throw new Error('Observation date and time is required.');return d.toISOString();}
async function nextRef(){const db=getSupabaseAdmin();const {data,error}=await db.rpc('next_portal_reference',{p_kind:'UCUA',p_prefix:'UCUA'});if(error)throw new Error(`Unable to generate reference: ${error.message}`);return data;}
async function uploadPhoto(reference,photo){if(!photo)return null;const mime=clean(photo.mimeType).toLowerCase();if(!allowedMimes.has(mime))throw new Error('Photo must be JPG, PNG or WEBP.');let buf;try{buf=Buffer.from(clean(photo.base64),'base64')}catch{throw new Error('Photo could not be read.')}if(!buf.length)throw new Error('Photo could not be read.');if(buf.length>5*1024*1024)throw new Error('Photo must be 5 MB or smaller.');const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';const path=`${new Date().getUTCFullYear()}/${reference}.${ext}`;const db=getSupabaseAdmin();const {error}=await db.storage.from('ucua-photos').upload(path,buf,{contentType:mime,upsert:false});if(error)throw new Error(`Unable to store photo: ${error.message}`);return path;}

export async function submitObservation(payload={}){
  if(payload?.anonymous) throw new Error('Anonymous submissions are not supported. Please provide your name and email address.');
  const name=clean(payload.name), submitterEmail=email(payload.email), company=clean(payload.company), type=clean(payload.observationType), location=clean(payload.location), observation=clean(payload.observation), action=clean(payload.actionTaken);
  if(!name)throw new Error('Name is required.');
  if(!submitterEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail))throw new Error('A valid email address is required.');
  if(!type||!allowedTypes.has(type))throw new Error('Please select a valid observation type.');if(!location)throw new Error('Location is required.');if(!observation)throw new Error('Observation details are required.');
  const reference=await nextRef();let photoPath=null;
  try{photoPath=await uploadPhoto(reference,payload.photo);const db=getSupabaseAdmin();const {data,error}=await db.from('observations').insert({reference_no:reference,observation_datetime:validateDate(payload.observationDateTime),submitter_name:name,submitter_email:submitterEmail,phone:null,company:company||null,observation_type:type,location,observation,action_taken:action||null,is_anonymous:false,tracking_token_hash:null,photo_storage_path:photoPath}).select('submitted_at').single();if(error)throw new Error(`Unable to save observation: ${error.message}`);return {ok:true,reference,submittedAt:data.submitted_at};}
  catch(e){if(photoPath){try{await getSupabaseAdmin().storage.from('ucua-photos').remove([photoPath])}catch{}}throw e;}
}

async function emailHasSubmission(addr){const db=getSupabaseAdmin();const {data,error}=await db.from('observations').select('id').eq('deleted',false).eq('is_anonymous',false).ilike('submitter_email',addr).limit(1);if(error)throw new Error('Unable to check submissions.');return !!data?.length;}
async function ensureAuthUser(addr){const db=getSupabaseAdmin();const {error}=await db.auth.admin.createUser({email:addr,email_confirm:true});if(error&&!/already|registered|exists/i.test(error.message||''))throw new Error(`Unable to prepare email verification: ${error.message}`);}
export async function requestMySubmissionsOtp(emailInput){const addr=email(emailInput);const generic={requested:true,message:'If submissions exist for this email, a verification code will be sent.'};if(!addr||!await emailHasSubmission(addr))return generic;await ensureAuthUser(addr);const {error}=await authClient().auth.signInWithOtp({email:addr,options:{shouldCreateUser:false,emailRedirectTo:portalUrl()+'/?otp_context=user'}});if(error)throw new Error(`Unable to send verification code: ${error.message}`);return generic;}
export async function verifyMySubmissionsOtp(emailInput,tokenInput){const addr=email(emailInput),token=clean(tokenInput);if(!addr||!token)throw new Error('Email and verification code are required.');if(!await emailHasSubmission(addr))throw new Error('Invalid or expired verification code.');const {data,error}=await authClient().auth.verifyOtp({email:addr,token,type:'email'});if(error||!data?.session||email(data.user?.email)!==addr)throw new Error('Invalid or expired verification code.');return {authenticated:true,sessionToken:data.session.access_token,expiresAt:new Date(Number(data.session.expires_at)*1000).toISOString()};}
async function verifiedEmail(token){const {data,error}=await authClient().auth.getUser(clean(token));if(error||!data?.user?.email)throw new Error('Your verification session has expired. Please verify your email again.');return email(data.user.email);}
export async function getMySubmissionsBySession(token){
  const addr=await verifiedEmail(token);
  const db=getSupabaseAdmin();
  const {data,error}=await db.from('observations').select('*').eq('deleted',false).eq('is_anonymous',false).ilike('submitter_email',addr).order('submitted_at',{ascending:false});
  if(error)throw new Error(`Unable to load submissions: ${error.message}`);
  const rows=data||[];
  const refs=rows.map(r=>r.reference_no).filter(Boolean);
  const byRef=new Map();
  if(refs.length){
    const {data:recognition,error:recognitionError}=await db.from('recognition').select('reference_no,category,notes,created_at').in('reference_no',refs).order('created_at',{ascending:false});
    if(recognitionError)throw new Error(`Unable to load recognition: ${recognitionError.message}`);
    for(const item of recognition||[]){
      const list=byRef.get(item.reference_no)||[];
      list.push({category:item.category,notes:item.notes||'',createdAt:item.created_at});
      byRef.set(item.reference_no,list);
    }
  }
  return rows.map(r=>publicRecord(r,byRef.get(r.reference_no)||[]));
}
export async function endMySubmissionsSession(){return {ok:true};}
