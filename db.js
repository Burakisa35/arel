import { sql } from '@vercel/postgres';

export async function initializeDatabase() {
  try {
    // Users tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'customer', -- customer, technician, admin, distributor, manufacturer
        email VARCHAR(255),
        avatar_url VARCHAR(255),
        rating DECIMAL(2,1) DEFAULT 0,
        total_jobs INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // OTP Codes tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(15) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Technicians tablosu (Extended)
    await sql`
      CREATE TABLE IF NOT EXISTS technicians (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES users(id),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        availability BOOLEAN DEFAULT TRUE,
        specialties TEXT[], -- ARRAY: elektrik, kamera, internet, etc
        experience_years INT,
        hourly_rate INT,
        service_area_radius INT DEFAULT 25, -- km
        last_location_update TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Service Requests tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES users(id),
        category VARCHAR(50) NOT NULL, -- elektrik, kamera, internet, uydu, motor
        description TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        address VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled
        assigned_technician_id INT REFERENCES users(id),
        estimated_price_min INT,
        estimated_price_max INT,
        final_price INT,
        scheduled_date TIMESTAMP,
        completed_date TIMESTAMP,
        rating INT, -- 1-5
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Price Quotes tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS price_quotes (
        id SERIAL PRIMARY KEY,
        service_request_id INT NOT NULL REFERENCES service_requests(id),
        technician_id INT NOT NULL REFERENCES users(id),
        quoted_price_min INT,
        quoted_price_max INT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Orders tablosu (B2B)
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES users(id),
        order_number VARCHAR(50) UNIQUE,
        total_amount INT,
        status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
        payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Distributor Inventory tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS distributor_inventory (
        id SERIAL PRIMARY KEY,
        distributor_id INT NOT NULL REFERENCES users(id),
        product_name VARCHAR(255),
        product_code VARCHAR(100),
        brand VARCHAR(100), -- Hikvision, Dahua, etc
        category VARCHAR(100), -- ip-kamera, nvr, dvr, etc
        quantity INT,
        unit_price INT,
        stock_status VARCHAR(50) DEFAULT 'available', -- available, low, out_of_stock
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Manufacturer Products tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS manufacturer_products (
        id SERIAL PRIMARY KEY,
        manufacturer_id INT NOT NULL REFERENCES users(id),
        product_name VARCHAR(255),
        model_number VARCHAR(100),
        specifications JSONB,
        unit_cost INT,
        wholesale_price INT,
        retail_price INT,
        description TEXT,
        image_url VARCHAR(500),
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_requests_technician ON service_requests(assigned_technician_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians(latitude, longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`;

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Get all available technicians nearby
export async function getNearbyTechnicians(lat, lng, radius = 25, specialties = []) {
  try {
    let query = `
      SELECT u.*, t.latitude, t.longitude, t.specialties, t.hourly_rate,
             SQRT(POWER(t.latitude - $1, 2) + POWER(t.longitude - $2, 2)) * 111 as distance_km
      FROM users u
      JOIN technicians t ON u.id = t.user_id
      WHERE t.availability = true
      AND SQRT(POWER(t.latitude - $1, 2) + POWER(t.longitude - $2, 2)) * 111 <= $3
    `;

    const params = [lat, lng, radius];

    if (specialties.length > 0) {
      query += ` AND t.specialties && $4`;
      params.push(specialties);
    }

    query += ` ORDER BY distance_km ASC LIMIT 10`;

    const result = await sql(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching nearby technicians:', error);
    throw error;
  }
}

// Get user by phone
export async function getUserByPhone(phone) {
  try {
    const result = await sql`SELECT * FROM users WHERE phone_number = ${phone}`;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Create service request
export async function createServiceRequest(customerId, category, description, lat, lng, address) {
  try {
    const result = await sql`
      INSERT INTO service_requests (customer_id, category, description, latitude, longitude, address)
      VALUES (${customerId}, ${category}, ${description}, ${lat}, ${lng}, ${address})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating service request:', error);
    throw error;
  }
}

// Get service request details
export async function getServiceRequest(requestId) {
  try {
    const result = await sql`SELECT * FROM service_requests WHERE id = ${requestId}`;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching service request:', error);
    throw error;
  }
}
