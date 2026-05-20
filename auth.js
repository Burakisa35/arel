import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// OTP gönder
async function sendOTP(phone) {
  try {
    // Eski OTP'leri temizle
    await sql`DELETE FROM otp_codes WHERE phone_number = ${phone} AND expires_at < NOW()`;

    // Yeni OTP oluştur
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    await sql`
      INSERT INTO otp_codes (phone_number, code, expires_at)
      VALUES (${phone}, ${code}, ${expiresAt})
    `;

    // Gerçek uygulamada: Twilio, AWS SNS vs ile SMS gönder
    // Test modunda: console'da göster
    console.log(`📱 OTP for ${phone}: ${code}`);

    return {
      success: true,
      message: 'OTP gönderildi',
      code: process.env.NODE_ENV === 'development' ? code : undefined // Dev'de göster, prod'da gizle
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

// OTP doğrula ve token oluştur
async function verifyOTP(phone, code) {
  try {
    // OTP kontrol et
    const otpResult = await sql`
      SELECT * FROM otp_codes 
      WHERE phone_number = ${phone} 
      AND code = ${code} 
      AND expires_at > NOW()
      AND is_used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!otpResult.rows[0]) {
      return {
        success: false,
        message: 'OTP geçersiz veya süresi dolmuş'
      };
    }

    // OTP'yi kullanıldı olarak işaretle
    await sql`
      UPDATE otp_codes 
      SET is_used = TRUE 
      WHERE id = ${otpResult.rows[0].id}
    `;

    // Kullanıcı var mı kontrol et
    let userResult = await sql`
      SELECT * FROM users WHERE phone_number = ${phone}
    `;

    let user = userResult.rows[0];

    // Yeni kullanıcı oluştur
    if (!user) {
      const createResult = await sql`
        INSERT INTO users (phone_number, role)
        VALUES (${phone}, 'customer')
        RETURNING *
      `;
      user = createResult.rows[0];
    }

    // JWT token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        phone_number: user.phone_number,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url
      },
      token
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

// Token doğrula
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Handler
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, phone, code, token } = req.body || req.query;

  try {
    if (action === 'send-otp') {
      if (!phone) {
        return res.status(400).json({ error: 'Telefon numarası gerekli' });
      }
      const result = await sendOTP(phone);
      return res.status(200).json(result);
    }

    if (action === 'verify-otp') {
      if (!phone || !code) {
        return res.status(400).json({ error: 'Telefon ve OTP gerekli' });
      }
      const result = await verifyOTP(phone, code);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(401).json(result);
      }
    }

    if (action === 'verify-token') {
      if (!token) {
        return res.status(400).json({ error: 'Token gerekli' });
      }
      const result = verifyToken(token);
      if (result.valid) {
        return res.status(200).json(result);
      } else {
        return res.status(401).json(result);
      }
    }

    return res.status(400).json({ error: 'Geçersiz işlem' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
