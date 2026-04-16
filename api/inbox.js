const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  const res = await fetch(`${UPSTASH_URL}/${command}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { address } = req.query;

  if (!address) return res.status(400).json({ error: 'Missing address' });

  if (req.method === 'GET') {
    const data = await redis('get', `inbox:${address}`);
    const messages = data.result ? JSON.parse(data.result) : [];
    return res.status(200).json({ address, messages });
  }

  if (req.method === 'POST') {
    const { from, subject, body, date } = req.body;
    const data = await redis('get', `inbox:${address}`);
    const messages = data.result ? JSON.parse(data.result) : [];
    const newMsg = { id: Date.now(), from, subject, body: body || '', date: date || new Date().toISOString() };
    messages.unshift(newMsg);
    await redis('set', `inbox:${address}`, JSON.stringify(messages));
    await redis('expire', `inbox:${address}`, '600');
    return res.status(200).json({ success: true, message: newMsg });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
