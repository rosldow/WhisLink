const { Pool } = require('pg');
require('dotenv').config();

// We default to a placeholder string if environment variable is not defined, 
// to prevent instant crashes before user adds the env var. Let the pool fail gracefully.
const connectionString = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false 
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.warn('PostgreSQL bağlantısı henüz kurulamadı. Lütfen .env dosyanıza geçerli bir DATABASE_URL ekleyin.', err.message);
        return;
    }
    console.log('Connected to PostgreSQL Database.');
    
    const initDb = async () => {
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user',
                    avatar_url TEXT,
                    bio TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // In case the table already existed, ensure the column is there
            try {
                await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'");
                await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
                await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT");
            } catch (ignore) {}


            await client.query(`
                CREATE TABLE IF NOT EXISTS lists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    share_token VARCHAR(255) UNIQUE,
                    is_public BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            try {
                await client.query("ALTER TABLE lists ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE");
                await client.query("ALTER TABLE lists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true");
                // Backfill tokens for existing lists safely
                await client.query("UPDATE lists SET share_token = md5(random()::text) WHERE share_token IS NULL");
            } catch (ignore) {}

            await client.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id VARCHAR(255) PRIMARY KEY,
                    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
                    title TEXT,
                    price VARCHAR(255),
                    image TEXT,
                    store VARCHAR(255),
                    url TEXT,
                    status VARCHAR(50),
                    reserved_by VARCHAR(255),
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            try {
                await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by VARCHAR(255)");
                await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0");
            } catch (ignore) {}

            console.log("All PostgreSQL tables ready (including Pro feature migrations).");
        } catch (dbErr) {
            console.error("Error creating PostgreSQL tables", dbErr);
        } finally {
            release();
        }
    };

    initDb();
});

module.exports = pool;
