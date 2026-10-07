import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sections = [
  ['A','Timeliness & Reliability', [['a1','On-Time Delivery'],['a2','Respond promptly'],['a3','Provides accurate info/product & service'],['a4','Service is there when needed'],['a5','Short lead time']]],
  ['B','Quality of Product & Services', [['b1','Provides 100% quality products & service'],['b2','Accepts responsibility of quality works'],['b3','Request constructive improvement'],['b4','Positive feedback'],['b5','Functionality of product/service']]],
  ['C','Responsive to Customer Needs', [['c1','Good listener'],['c2','Delivers to point of use'],['c3','Review changes with customers'],['c4','Competitive cost'],['c5','Is always there when needed']]],
  ['D','Communication with Customer', [['d1','Communication clear'],['d2','Positive attitude'],['d3','Understand customer needs'],['d4','Develops new idea with customer'],['d5','Maintains regular communication']]]
];

const C = {
  navy: rgb(0.025,0.27,0.39), blue: rgb(0.03,0.47,0.66), green: rgb(0.02,0.55,0.31),
  red: rgb(0.88,0.04,0.12), ink: rgb(0.035,0.17,0.25), muted: rgb(0.36,0.45,0.51),
  pale: rgb(0.965,0.98,0.987), line: rgb(0.84,0.89,0.92), white: rgb(1,1,1), track: rgb(0.88,0.92,0.94)
};
const safe = v => String(v ?? '').replace(/[\u{10000}-\u{10FFFF}]/gu,'');
const n = v => Math.max(0, Math.min(5, Number(v) || 0));
const pct = v => Math.max(0, Math.min(100, Number(v) || 0));
function fit(text,font,size,max){ let s=safe(text); while(s.length>1 && font.widthOfTextAtSize(s,size)>max) s=s.slice(0,-1); return s===safe(text)?s:s.slice(0,-1)+'…'; }
function wrap(text,font,size,max,limit=4){ const words=safe(text||'—').split(/\s+/); const lines=[]; let cur=''; for(const w of words){const t=(cur+' '+w).trim(); if(font.widthOfTextAtSize(t,size)<=max) cur=t; else {if(cur)lines.push(cur);cur=w;if(lines.length===limit-1)break;}} if(cur&&lines.length<limit)lines.push(cur); return lines; }
function roundRect(page,x,y,w,h,r,fill,border=C.line,bw=.7){ page.drawRectangle({x:x+r,y,width:w-2*r,height:h,color:fill});page.drawRectangle({x,y:y+r,width:w,height:h-2*r,color:fill}); page.drawCircle({x:x+r,y:y+r,size:r,color:fill});page.drawCircle({x:x+w-r,y:y+r,size:r,color:fill});page.drawCircle({x:x+r,y:y+h-r,size:r,color:fill});page.drawCircle({x:x+w-r,y:y+h-r,size:r,color:fill}); if(border){page.drawLine({start:{x:x+r,y},end:{x:x+w-r,y},thickness:bw,color:border});page.drawLine({start:{x:x+r,y:y+h},end:{x:x+w-r,y:y+h},thickness:bw,color:border});page.drawLine({start:{x,y:y+r},end:{x,y:y+h-r},thickness:bw,color:border});page.drawLine({start:{x:x+w,y:y+r},end:{x:x+w,y:y+h-r},thickness:bw,color:border});}}

export async function buildSurveyPdf(row){
  const pdf=await PDFDocument.create(); const regular=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold); const italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page=pdf.addPage([595.28,841.89]); const W=595.28, H=841.89;
  // Header
  page.drawRectangle({x:0,y:H-116,width:W,height:116,color:C.navy}); page.drawRectangle({x:0,y:H-118,width:W,height:2,color:C.red});
  try { const here=path.dirname(fileURLToPath(import.meta.url)); const logoBytes=fs.readFileSync(path.join(here,'../assets/images/dpi-logo.png')); const logo=await pdf.embedPng(logoBytes); const sc=Math.min(74/logo.width,42/logo.height); roundRect(page,42,H-91,86,54,6,C.white,null,0); page.drawImage(logo,{x:49,y:H-84,width:logo.width*sc,height:logo.height*sc}); } catch {}
  page.drawText('DPI CUSTOMER EXPERIENCE PORTAL',{x:145,y:H-50,size:7.5,font:bold,color:C.white});
  page.drawText('Voice of Customer',{x:145,y:H-73,size:19,font:bold,color:C.white});
  page.drawText('Customer Feedback Showcase',{x:145,y:H-91,size:8.5,font:regular,color:rgb(.83,.91,.96)});
  // KPI + quote
  const satisfaction=pct(row.overall_percentage); page.drawText(`${satisfaction.toFixed(satisfaction%1?1:0)}%`,{x:255,y:676,size:39,font:bold,color:C.green});
  page.drawText('CUSTOMER SATISFACTION',{x:238,y:660,size:8,font:bold,color:C.muted});
  roundRect(page,130,574,335,70,9,C.pale,null,0); page.drawText('“',{x:148,y:617,size:22,font:bold,color:C.blue});
  const quote=wrap(row.comments,italic,7.6,270,4); quote.forEach((t,i)=>page.drawText(t,{x:172,y:617-i*11,size:7.6,font:italic,color:C.ink}));
  const who=[row.customer_name,row.customer_company,row.location].filter(Boolean).map(safe).join('  |  '); page.drawText(fit(who,bold,6.3,270),{x:172,y:579,size:6.3,font:bold,color:C.ink});
  page.drawText('20-POINT ASSESSMENT MATRIX',{x:42,y:552,size:10,font:bold,color:C.ink});

  const cardW=248, cardH=150, gapX=15, left=42, topY=536;
  sections.forEach((sec,si)=>{
    const col=si%2,rowi=Math.floor(si/2); const x=left+col*(cardW+gapX), y=topY-cardH-rowi*(cardH+10); const [letter,title,items]=sec; const avgKey='avg_'+items[0][0][0]; const avg=n(row[avgKey]); const percentage=avg*20;
    roundRect(page,x,y,cardW,cardH,7,C.white,C.line,.8); page.drawCircle({x:x+22,y:y+cardH-22,size:13,color:C.blue}); page.drawText(letter,{x:x+17.3,y:y+cardH-27,size:14,font:bold,color:C.white});
    page.drawText(fit(title,bold,8,145),{x:x+43,y:y+cardH-19,size:8,font:bold,color:C.ink}); page.drawText(`Section Average: ${avg.toFixed(2)} / 5.00`,{x:x+43,y:y+cardH-31,size:6.2,font:bold,color:C.ink});
    page.drawText(`${percentage.toFixed(percentage%1?1:0)}%`,{x:x+205,y:y+cardH-23,size:13,font:bold,color:C.green});
    page.drawRectangle({x:x+43,y:y+cardH-44,width:190,height:7,color:C.track}); page.drawRectangle({x:x+43,y:y+cardH-44,width:190*(percentage/100),height:7,color:C.blue});
    items.forEach(([key,label],ii)=>{const yy=y+cardH-65-ii*16; page.drawRectangle({x:x+10,y:yy-5,width:14,height:13,color:C.pale}); page.drawText(String(si*5+ii+1),{x:x+14,y:yy-1,size:6.2,font:bold,color:C.ink}); page.drawText(fit(label,regular,6.2,133),{x:x+31,y:yy-1,size:6.2,font:regular,color:C.ink}); const score=n(row[key]); page.drawText(`${score||0}/5`,{x:x+171,y:yy-1,size:6.3,font:bold,color:C.ink}); page.drawRectangle({x:x+197,y:yy-3,width:38,height:6,color:C.track}); page.drawRectangle({x:x+197,y:yy-3,width:38*(score/5),height:6,color:C.blue});});
  });
  // Project snapshot
  roundRect(page,42,77,511,64,7,C.navy,null,0); page.drawText('PROJECT SNAPSHOT',{x:60,y:119,size:7,font:bold,color:rgb(.78,.9,.96)});
  const snap=[row.equipment_on_site||'Project / Equipment not specified', row.crew_on_site?`DPI Crew: ${row.crew_on_site}`:null, row.survey_date?`Survey: ${safe(row.survey_date).slice(0,10)}`:null].filter(Boolean).join('  •  ');
  page.drawText(fit(snap,bold,8.2,470),{x:60,y:94,size:8.2,font:bold,color:C.white});
  page.drawLine({start:{x:42,y:58},end:{x:553,y:58},thickness:.7,color:C.line}); page.drawText(`${safe(row.reference_no||'')}  |  Generated by DPI Customer Experience Portal`,{x:42,y:43,size:6.5,font:regular,color:C.muted}); page.drawText('Page 1 of 1',{x:508,y:43,size:6.5,font:regular,color:C.muted});
  const bytes=await pdf.save(); return Buffer.from(bytes).toString('base64');
}
