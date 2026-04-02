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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS lists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log("All PostgreSQL tables ready.");
        } catch (dbErr) {
            console.error("Error creating PostgreSQL tables", dbErr);
        } finally {
            release();
        }
    };

    initDb();
});

module.exports = pool;
