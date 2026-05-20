// FAZ-2 placeholder — B2B envanter yönetimi henüz aktif değil.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(501).json({
    error: 'Bu özellik henüz aktif değil.',
    bilgi: 'Envanter yönetimi FAZ-2 kapsamında etkinleştirilecektir.',
  });
}
