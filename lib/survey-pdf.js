import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
const sections=[
 ['A. Timeliness & Reliability of Delivery',[['a1','On-Time Delivery'],['a2','Respond promptly'],['a3','Provides accurate info/product/service'],['a4','Service is there when needed'],['a5','Short lead time']]],
 ['B. Quality of Product & Services',[['b1','Provides 100% quality products/service'],['b2','Accepts responsibility of quality works'],['b3','Request constructive improvement'],['b4','Positive feedback'],['b5','Functionality of Product/Services']]],
 ['C. Responsive to Customer Needs',[['c1','Good listener'],['c2','Delivers to point of use'],['c3','Review changes with customer'],['c4','Competitive cost'],['c5','Is always there when needed']]],
 ['D. Communication with Customer',[['d1','Communication clear'],['d2','Positive attitude'],['d3','Understand customer needs'],['d4','Develops new idea with customer'],['d5','Maintains regular communication']]]
];
function safe(v){return String(v??'').replace(/[\u{10000}-\u{10FFFF}]/gu,'');}
export async function buildSurveyPdf(row){
 const pdf=await PDFDocument.create(), regular=await pdf.embedFont(StandardFonts.Helvetica), bold=await pdf.embedFont(StandardFonts.HelveticaBold); let page,y;
 const newPage=()=>{page=pdf.addPage([595.28,841.89]);y=800;page.drawText('DPI Customer Satisfaction Survey',{x:42,y,size:18,font:bold,color:rgb(.05,.25,.38)});y-=28;};
 const line=(label,value)=>{if(y<65)newPage();page.drawText(safe(label),{x:42,y,size:9,font:bold});page.drawText(safe(value||'—').slice(0,88),{x:175,y,size:9,font:regular});y-=16;};
 newPage(); line('Reference',row.reference_no);line('Customer',row.customer_name);line('Email',row.customer_email);line('Company',row.customer_company);line('Location / Field / Rig',row.location);line('Equipment ID On-Site',row.equipment_on_site);line('Crew On-Site',row.crew_on_site);line('Survey Date',row.survey_date);line('Submitted At',row.submitted_at); y-=5;
 for(const [title,items] of sections){if(y<145)newPage();page.drawText(title,{x:42,y,size:11,font:bold});y-=18;for(const [key,label] of items)line(label,`${row[key]} / 5`);const avgKey='avg_'+items[0][0][0];line('Section Average',`${Number(row[avgKey]||0).toFixed(2)} / 5`);y-=7;}
 if(y<145)newPage();page.drawText('Overall Result',{x:42,y,size:11,font:bold});y-=20;line('Overall Average',`${Number(row.overall_average||0).toFixed(2)} / 5`);line('Satisfaction',`${Number(row.overall_percentage||0).toFixed(1)}%`);y-=8;page.drawText('Comments by Customer',{x:42,y,size:10,font:bold});y-=16;
 const words=safe(row.comments||'—').split(/\s+/);let cur='';for(const w of words){const test=(cur+' '+w).trim();if(regular.widthOfTextAtSize(test,9)>505){if(y<55)newPage();page.drawText(cur,{x:42,y,size:9,font:regular});y-=13;cur=w}else cur=test}if(cur){page.drawText(cur,{x:42,y,size:9,font:regular});y-=13}
 y-=15;page.drawText('Rating scale: 1 = Very dissatisfied   2 = Dissatisfied   3 = Neutral   4 = Satisfied   5 = Very satisfied',{x:42,y,size:8,font:regular,color:rgb(.35,.4,.45)});
 const bytes=await pdf.save();return Buffer.from(bytes).toString('base64');
}
