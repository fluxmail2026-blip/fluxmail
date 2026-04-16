const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  const res = await fetch(`${UPSTASH_URL}/${command}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return res.json();
}

const words = ['ghost','void','flux','null','echo','arc','ion','bit','node','wave','drift','prism','spark','nova','zero','byte'];

function generateAddress() {
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${w1}${w2}_${n}@fluxmail.cc`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const address = generateAddress();
  await redis('set', `inbox:${address}`, JSON.stringify([]));
  await redis('expire', `inbox:${address}`, '600');

  return res.status(200).json({
    address,
    expires_in: 600,
    expires_at: new Date(Date.now() + 600000).toISOString()
  });
}
