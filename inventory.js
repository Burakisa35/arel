import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  try {
    const result = await sql`
      SELECT * FROM distributor_inventory
      LIMIT 100
    `;

    const inventory = result.rows.map(item => ({
      id: item.id,
      product_name: item.product_name,
      brand: item.brand,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      stock_status: item.stock_status
    }));

    return res.status(200).json({
      success: true,
      inventory: inventory.length > 0 ? inventory : generateMockInventory()
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({
      success: true,
      inventory: generateMockInventory()
    });
  }
}

function generateMockInventory() {
  return [
    { id: 1, product_name: 'IP Kamera 2MP', brand: 'Hikvision', category: 'ip-kamera', quantity: 15, unit_price: 2500, stock_status: 'available' },
    { id: 2, product_name: 'NVR 8 Kanal', brand: 'Dahua', category: 'nvr', quantity: 5, unit_price: 3500, stock_status: 'low' },
    { id: 3, product_name: 'PoE Switch', brand: 'TP-Link', category: 'poe-switch', quantity: 0, unit_price: 1200, stock_status: 'out_of_stock' }
  ];
}
