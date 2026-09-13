import { getSupabaseAdmin } from './supabase.js';

const SCORE_KEYS = Object.freeze([
  'a1','a2','a3','a4','a5',
  'b1','b2','b3','b4','b5',
  'c1','c2','c3','c4','c5',
  'd1','d2','d3','d4','d5'
]);

function cleanText(value, field, { required = false, max = 500 } = {}){
  const text = String(value ?? '').trim();
  if(required && !text) throw new Error(`${field} is required.`);
  if(text.length > max) throw new Error(`${field} is too long.`);
  return text;
}

function normalizeEmail(value){
  return String(value ?? '').trim().toLowerCase();
}

function validateEmail(email){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    throw new Error('Please enter a valid customer email address.');
  }
}

function validateDate(value){
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) throw new Error('Please select a valid survey date.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if(
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ){
    throw new Error('Please select a valid survey date.');
  }

  return text;
}

function score(value, key){
  const n = Number(value);
  if(!Number.isInteger(n) || n < 1 || n > 5){
    throw new Error(`Please rate every survey item from 1 to 5. Missing or invalid score: ${key.toUpperCase()}.`);
  }
  return n;
}

function average(values){
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round2(value){
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function buildSurvey(payload){
  if(!payload || typeof payload !== 'object') throw new Error('Survey data is missing.');

  const customerName = cleanText(payload.customerName, 'Customer name', { required: true, max: 200 });
  const email = normalizeEmail(payload.email);
  if(!email) throw new Error('Customer email is required.');
  validateEmail(email);

  const customerCompany = cleanText(payload.company, 'Company', { required: true, max: 250 });
  const location = cleanText(payload.location, 'Location / Field / Rig', { required: true, max: 250 });
  const equipmentOnSite = cleanText(payload.equipmentOnSite, 'Equipment ID On-Site', { max: 250 });
  const crewOnSite = cleanText(payload.crewOnSite, 'Crew On-Site', { max: 500 });
  const surveyDate = validateDate(payload.surveyDate);
  const comments = cleanText(payload.comments, 'Customer comments', { required: true, max: 5000 });

  const sourceScores = payload.scores && typeof payload.scores === 'object' ? payload.scores : {};
  const scores = {};
  for(const key of SCORE_KEYS) scores[key] = score(sourceScores[key], key);

  const groupA = ['a1','a2','a3','a4','a5'].map(k => scores[k]);
  const groupB = ['b1','b2','b3','b4','b5'].map(k => scores[k]);
  const groupC = ['c1','c2','c3','c4','c5'].map(k => scores[k]);
  const groupD = ['d1','d2','d3','d4','d5'].map(k => scores[k]);

  const avgA = round2(average(groupA));
  const avgB = round2(average(groupB));
  const avgC = round2(average(groupC));
  const avgD = round2(average(groupD));
  const overallAverage = round2(average([...groupA, ...groupB, ...groupC, ...groupD]));
  const percentage = round2((overallAverage / 5) * 100);

  return {
    customerName,
    email,
    customerCompany,
    location,
    equipmentOnSite,
    crewOnSite,
    surveyDate,
    comments,
    scores,
    avgA,
    avgB,
    avgC,
    avgD,
    overallAverage,
    percentage
  };
}

export async function submitCustomerSurvey(payload){
  const survey = buildSurvey(payload);
  const supabase = getSupabaseAdmin();

  const { data: reference, error: referenceError } = await supabase
    .rpc('next_portal_reference', { p_prefix: 'CSS' });

  if(referenceError){
    console.error('Customer survey reference generation failed:', referenceError.message);
    throw new Error('Unable to generate a survey reference. Please try again.');
  }

  const referenceNo = String(reference || '').trim();
  if(!referenceNo) throw new Error('Unable to generate a survey reference. Please try again.');

  const row = {
    reference_no: referenceNo,
    customer_name: survey.customerName,
    customer_email: survey.email,
    customer_company: survey.customerCompany,
    location: survey.location,
    equipment_on_site: survey.equipmentOnSite || null,
    crew_on_site: survey.crewOnSite || null,
    survey_date: survey.surveyDate,
    comments: survey.comments,
    a1: survey.scores.a1,
    a2: survey.scores.a2,
    a3: survey.scores.a3,
    a4: survey.scores.a4,
    a5: survey.scores.a5,
    avg_a: survey.avgA,
    b1: survey.scores.b1,
    b2: survey.scores.b2,
    b3: survey.scores.b3,
    b4: survey.scores.b4,
    b5: survey.scores.b5,
    avg_b: survey.avgB,
    c1: survey.scores.c1,
    c2: survey.scores.c2,
    c3: survey.scores.c3,
    c4: survey.scores.c4,
    c5: survey.scores.c5,
    avg_c: survey.avgC,
    d1: survey.scores.d1,
    d2: survey.scores.d2,
    d3: survey.scores.d3,
    d4: survey.scores.d4,
    d5: survey.scores.d5,
    avg_d: survey.avgD,
    overall_average: survey.overallAverage,
    overall_percentage: survey.percentage,
    status: 'submitted'
  };

  const { data, error } = await supabase
    .from('customer_surveys')
    .insert(row)
    .select('id, reference_no, submitted_at, overall_average, overall_percentage')
    .single();

  if(error){
    console.error('Customer survey insert failed:', error.message);
    throw new Error('The survey could not be saved. Please try again.');
  }

  return {
    ok: true,
    reference: data.reference_no,
    submittedAt: data.submitted_at,
    overallAverage: Number(data.overall_average),
    percentage: Number(data.overall_percentage),

    // Email + PDF services are intentionally implemented in later Stage 3C steps.
    adminNotificationSent: false,
    customerCopySent: false,
    adminPdfAttached: false,
    customerNotificationError: 'Customer email service is not configured yet.',
    adminNotificationError: 'Admin email/PDF service is not configured yet.'
  };
}
