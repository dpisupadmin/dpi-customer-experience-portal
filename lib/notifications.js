import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from './supabase.js';

export const NOTIFICATION_TYPES=new Set(['customer_survey','ucua']);
export function normalizeNotificationType(v){const t=String(v||'').trim().toLowerCase();if(!NOTIFICATION_TYPES.has(t))throw new Error('Invalid notification type.');return t;}
export function normalizeRecipientEmail(v){return String(v||'').trim().toLowerCase();}
export function validRecipientEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}

export async function activeRecipients(type){
  const db=getSupabaseAdmin();
  const {data,error}=await db.from('notification_recipients').select('name,email').eq('notification_type',normalizeNotificationType(type)).eq('is_active',true).order('email');
  if(error){console.error('Notification recipient lookup failed:',error.message);return []}
  return data||[];
}
function smtpTransport(){
  const user=process.env.SMTP_USER, pass=process.env.SMTP_PASS;
  if(!user||!pass)return null;
  return nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.gmail.com',port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||'false').toLowerCase()==='true',auth:{user,pass}});
}
export async function sendSubmissionNotification(type,{subject,html,text}){
  const recipients=await activeRecipients(type); if(!recipients.length)return {sent:0,configured:true};
  const tx=smtpTransport(); if(!tx){console.warn('Submission notification skipped: SMTP_USER/SMTP_PASS not configured.');return {sent:0,configured:false};}
  const from=process.env.SMTP_FROM||process.env.SMTP_USER;
  const results=await Promise.allSettled(recipients.map(r=>tx.sendMail({from,to:r.email,subject,text,html})));
  const sent=results.filter(x=>x.status==='fulfilled').length;
  results.filter(x=>x.status==='rejected').forEach(x=>console.error('Notification email failed:',x.reason?.message||x.reason));
  return {sent,configured:true,total:recipients.length};
}
export function portalAdminUrl(){return process.env.PORTAL_PUBLIC_URL||'https://dpi-customer-experience-portal.vercel.app';}
