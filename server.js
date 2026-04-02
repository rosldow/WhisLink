require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wishlink_super_secret_key_v1'; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

// --- AUTH API ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(`INSERT INTO users (username, password) VALUES ($1, $2)`, [username, hashedPassword]);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === '23505') { // Postgres unique violation code
            return res.status(400).json({ error: "Kullanıcı adı daha önce alınmış." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
        const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        const user = result.rows[0];
        
        if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Hatalı şifre." });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API ---
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const listsCount = await pool.query('SELECT COUNT(*) FROM lists');
        const productsCount = await pool.query('SELECT COUNT(*) FROM products');
        
        res.json({
            users: parseInt(usersCount.rows[0].count),
            lists: parseInt(listsCount.rows[0].count),
            products: parseInt(productsCount.rows[0].count)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.username, u.role, u.created_at, 
                   COUNT(l.id) as list_count 
            FROM users u 
            LEFT JOIN lists l ON u.id = l.user_id 
            GROUP BY u.id 
            ORDER BY u.created_at DESC
        `);
        res.json({ users: result.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: "User deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- LISTS API ---
app.get('/api/lists', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM lists WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
        res.json({ lists: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/lists', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const result = await pool.query(
            `INSERT INTO lists (user_id, name, description) VALUES ($1, $2, $3) RETURNING id`, 
            [req.user.id, name, description]
        );
        res.status(201).json({ list: { id: result.rows[0].id, name, description } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/lists/:id', async (req, res) => {
    const listId = req.params.id;
    try {
        const result = await pool.query(`SELECT lists.*, users.username FROM lists JOIN users ON lists.user_id = users.id WHERE lists.id = $1`, [listId]);
        const list = result.rows[0];
        if (!list) return res.status(404).json({ error: "List not found" });
        res.json({ list });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- PRODUCTS API ---
app.get('/api/products', async (req, res) => {
    const listId = req.query.list_id;
    if (!listId) return res.status(400).json({ error: "list_id is required" });

    try {
        const result = await pool.query("SELECT * FROM products WHERE list_id = $1 ORDER BY created_at DESC", [listId]);
        res.json({ products: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products/scrape', authenticateToken, async (req, res) => {
    const { url, list_id } = req.body;
    
    if (!url || !list_id) {
        return res.status(400).json({ error: "URL and list_id are required" });
    }

    try {
        let title = "Bilinmeyen Ürün (Düzenleyin)";
        let image = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"; 
        let price = "Fiyat Bekleniyor";
        let store = "Web Mağazası";

        if(url.toLowerCase().includes('trendyol')) store = 'Trendyol';
        else if(url.toLowerCase().includes('amazon')) store = 'Amazon';
        else if(url.toLowerCase().includes('hepsiburada')) store = 'Hepsiburada';

        try {
            const response = await axios.get(url, { headers: { "User-Agent": USER_AGENT } });
            const html = response.data;
            const $ = cheerio.load(html);

            const ogTitle = $('meta[property="og:title"]').attr('content');
            const ogImage = $('meta[property="og:image"]').attr('content');
            
            if (ogTitle) title = ogTitle.split(' | ')[0] || ogTitle; 
            else if ($('title').text()) title = $('title').text();

            if (ogImage) image = ogImage;

            if (store === 'Trendyol') {
                const prc = $('.prc-dsc').text() || $('.prc-slg').text();
                const titleTrendyol = $('.pr-new-br span').text();
                if(prc) price = prc;
                if(titleTrendyol) title = titleTrendyol;
            } else if (store === 'Amazon') {
                const prc = $('.a-price-whole').first().text() + $('.a-price-fraction').first().text() + " TL";
                if(prc && prc !== " TL") price = prc;
            }
        } catch (scrapeErr) {
            console.warn(`Scraping failed for ${url}, using fallback text.`);
        }

        const id = Date.now().toString();
        const status = 'available';

        await pool.query(
            "INSERT INTO products (id, list_id, title, price, image, store, url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [id, list_id, title, price, image, store, url, status]
        );
        res.status(201).json({
            product: { id, list_id, title, price, image, store, url, status }
        });
    } catch (error) {
        console.error("Critical error in /scrape block:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit Product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, price, image } = req.body;

    try {
        const result = await pool.query("UPDATE products SET title = $1, price = $2, image = $3 WHERE id = $4", [title, price, image, id]);
        res.json({ message: "Product updated", changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ message: "deleted", changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
