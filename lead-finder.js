/**
 * CodeRaksh Company - AI Lead Finder (Direct Automation)
 * Runs directly on your PC with Node.js - No n8n or heavy software needed!
 */

const fs = require('fs');
const path = require('path');

// 1. Settings & Config
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const CITY = process.env.TARGET_CITY || 'Pune';
const NICHES = [
  'restaurant in Pune',
  'clinic doctor in Pune',
  'CA chartered accountant in Pune',
  'gym fitness center in Pune',
  'salon beauty parlour in Pune',
  'coaching institute in Pune',
  'hotel guest house in Pune'
];

// Pick today's niche automatically
const dayIndex = new Date().getDay();
const TODAY_NICHE = NICHES[dayIndex % NICHES.length];
const MAX_RESULTS = 25;

console.log('='.repeat(60));
console.log('🚀 CodeRaksh Lead Finder Starting...');
console.log(`📍 City: ${CITY}`);
console.log(`🎯 Today's Target Niche: ${TODAY_NICHE}`);
console.log(`📊 Max Results: ${MAX_RESULTS}`);
console.log('='.repeat(60));

async function fetchPlaces() {
  if (!GOOGLE_API_KEY) {
    console.error('\n❌ Configuration Notice: GOOGLE_API_KEY environment variable is not set.');
    console.error('👉 Please export GOOGLE_API_KEY="AIza..." or set it in your .env file.\n');
    return [];
  }

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri'
    },
    body: JSON.stringify({
      textQuery: TODAY_NICHE,
      pageSize: MAX_RESULTS,
      locationBias: {
        circle: {
          center: { latitude: 18.5204, longitude: 73.8567 },
          radius: 30000.0
        }
      }
    })
  });

  const data = await res.json();
  if (data.error) {
    if (data.error.code === 403) {
      console.error('\n❌ Google Cloud Error: Places API (New) is not enabled for your project.');
      console.error('👉 Please enable "Places API (New)" in your Google Cloud Console.\n');
    } else {
      console.error('\n❌ Google API Error:', data.error.message);
    }
    return [];
  }

  return (data.places || []).filter(p => p.websiteUri);
}

function generateObservationAndPitch(biz) {
  const rating = biz.rating || 0;
  const reviews = biz.userRatingCount || 0;
  const name = biz.displayName?.text || 'Business';

  let observation = '';
  let firstLine = '';
  let fitScore = 8;
  let reason = '';

  if (rating >= 4.5 && reviews > 50) {
    observation = `Strong reputation with ${rating}★ from ${reviews} reviews, but manual inquiry handling is leaking leads.`;
    firstLine = `Saw your impressive ${rating}★ rating on Google Maps in Pune — wanted to share how we automate WhatsApp inquiries so zero leads slip away.`;
    fitScore = 9;
    reason = 'High traffic and great reviews = ideal customer for automated lead response.';
  } else if (reviews < 20) {
    observation = `Active business in Pune but under-leveraging automated review collection.`;
    firstLine = `Came across your Pune listing — we built an automated bot that helps local businesses collect 3x more Google reviews on autopilot.`;
    fitScore = 8;
    reason = 'Needs automated review capture and reputation boost.';
  } else {
    observation = `Established Pune presence; customer bookings/orders can be automated 24/7.`;
    firstLine = `Noticed your presence in Pune — wanted to see if you have considered an AI receptionist to handle after-hours inquiries.`;
    fitScore = 8;
    reason = 'Standard high-fit candidate for CodeRaksh automation suite.';
  }

  return { observation, firstLine, fitScore, reason };
}

async function run() {
  const places = await fetchPlaces();
  if (!places.length) {
    console.log('⚠️ No leads found or API not enabled. Fix the API key/permission and try again.');
    return;
  }

  console.log(`\n✅ Found ${places.length} businesses with active websites in Pune!\n`);

  const rows = [];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const name = p.displayName?.text || 'N/A';
    const website = p.websiteUri || '';
    const rating = p.rating || 0;
    const reviews = p.userRatingCount || 0;
    const address = (p.formattedAddress || '').replace(/[\r\n,]/g, ' ');
    const maps = p.googleMapsUri || '';

    const ai = generateObservationAndPitch(p);

    console.log(`[${i + 1}/${places.length}] ${name} (${rating}★, ${reviews} rev)`);
    console.log(`   💡 First Line: "${ai.firstLine}"`);

    rows.push({
      date: todayStr,
      niche: TODAY_NICHE,
      business: name,
      website: website,
      rating: rating,
      reviews: reviews,
      address: address,
      maps: maps,
      observation: ai.observation,
      firstLine: ai.firstLine,
      fitScore: ai.fitScore,
      reason: ai.reason
    });
  }

  // Save to CSV (Can be directly imported or pasted into Google Sheets)
  const csvHeaders = 'Date,Niche,Business,Website,Rating,Reviews,Address,Maps link,Observation,First line,Fit score,Reason\n';
  const csvContent = rows.map(r => 
    `"${r.date}","${r.niche}","${r.business.replace(/"/g, '""')}","${r.website}","${r.rating}","${r.reviews}","${r.address.replace(/"/g, '""')}","${r.maps}","${r.observation.replace(/"/g, '""')}","${r.firstLine.replace(/"/g, '""')}","${r.fitScore}","${r.reason.replace(/"/g, '""')}"`
  ).join('\n');

  const outputFile = path.join(__dirname, 'leads_output.csv');
  fs.writeFileSync(outputFile, csvHeaders + csvContent, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 SUCCESS! ${rows.length} Leads saved to: leads_output.csv`);
  console.log('📁 You can open leads_output.csv in Excel or import directly into your Google Sheet!');
  console.log('='.repeat(60));
}

run();
