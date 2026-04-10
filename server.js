require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wishlink_super_secret_key_v1'; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Auth Middlewares
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

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) req.user = user;
            next();
        });
    } else {
        next();
    }
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
        if (err.code === '23505') return res.status(400).json({ error: "Kullanıcı adı daha önce alınmış." });
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

// --- PROFILE API ---
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT username, role, avatar_url, bio, created_at FROM users WHERE id = $1", [req.user.id]);
        res.json({ profile: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { avatar_url, bio } = req.body;
    try {
        await pool.query("UPDATE users SET avatar_url = $1, bio = $2 WHERE id = $3", [avatar_url, bio, req.user.id]);
        res.json({ message: "Profile updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    const shareToken = crypto.randomUUID();
    try {
        const result = await pool.query(
            `INSERT INTO lists (user_id, name, description, share_token) VALUES ($1, $2, $3, $4) RETURNING *`, 
            [req.user.id, name, description, shareToken]
        );
        res.status(201).json({ list: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/public-list/:token', async (req, res) => {
    const token = req.params.token;
    try {
        const result = await pool.query(`
            SELECT lists.*, users.username, users.avatar_url, users.bio 
            FROM lists 
            JOIN users ON lists.user_id = users.id 
            WHERE lists.share_token = $1 OR lists.id::text = $1
        `, [token]); // Fallback to ID strictly for backward compatibility
        const list = result.rows[0];
        if (!list) return res.status(404).json({ error: "List not found" });
        res.json({ list });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCTS API ---
app.get('/api/products', optionalAuth, async (req, res) => {
    const { token } = req.query; // now fetch by token
    if (!token) return res.status(400).json({ error: "token is required" });

    try {
        const listResult = await pool.query("SELECT id, user_id FROM lists WHERE share_token = $1 OR id::text = $1", [token]);
        if (listResult.rows.length === 0) return res.status(404).json({ error: "List not found" });
        const list = listResult.rows[0];

        const productsResult = await pool.query("SELECT * FROM products WHERE list_id = $1 ORDER BY sort_order ASC, created_at DESC", [list.id]);
        let products = productsResult.rows;

        // Censor reservations if the requester is the owner
        const isOwner = req.user && req.user.id === list.user_id;
        if (isOwner) {
            products = products.map(p => ({ ...p, reserved_by: null }));
        }

        res.json({ products, isOwner });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products/scrape', authenticateToken, async (req, res) => {
    const { url, token } = req.body;
    if (!url || !token) return res.status(400).json({ error: "URL and list token are required" });

    try {
        const listResult = await pool.query("SELECT id FROM lists WHERE (share_token = $1 OR id::text = $1) AND user_id = $2", [token, req.user.id]);
        if (listResult.rows.length === 0) return res.status(403).json({ error: "Unauthorized for this list" });
        const list_id = listResult.rows[0].id;

        let title = "Bilinmeyen Ürün (Düzenleyin)";
        let image = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"; 
        let price = "Fiyat Bekleniyor";
        let store = "Web Mağazası";

        if(url.toLowerCase().includes('trendyol')) store = 'Trendyol';
        else if(url.toLowerCase().includes('amazon')) store = 'Amazon';
        else if(url.toLowerCase().includes('hepsiburada')) store = 'Hepsiburada';

        try {
            const response = await axios.get(url, { headers: { "User-Agent": USER_AGENT } });
            const $ = cheerio.load(response.data);
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
        } catch (e) {
            console.warn(`Scraping failed for ${url}, using fallback text.`);
        }

        const id = Date.now().toString();
        await pool.query(
            "INSERT INTO products (id, list_id, title, price, image, store, url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')",
            [id, list_id, title, price, image, store, url]
        );
        res.status(201).json({ product: { id, list_id, title, price, image, store, url, status: 'available' } });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

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

// CLAIM (RESERVE) PRODUCT (Guest functionality allowed)
app.patch('/api/products/:id/reserve', async (req, res) => {
    const { id } = req.params;
    const { reserver_name } = req.body;
    if (!reserver_name) return res.status(400).json({ error: "Name required" });

    try {
        const current = await pool.query("SELECT reserved_by FROM products WHERE id = $1", [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: "Product not found" });
        if (current.rows[0].reserved_by) return res.status(400).json({ error: "Already reserved" });

        await pool.query("UPDATE products SET reserved_by = $1, status = 'claimed' WHERE id = $2", [reserver_name, id]);
        res.json({ message: "Reserved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id/reserve', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE products SET reserved_by = null, status = 'available' WHERE id = $1", [id]);
        res.json({ message: "Reservation cancelled" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DRAG AND DROP REORDER
app.put('/api/products/reorder', authenticateToken, async (req, res) => {
    const items = req.body.items; // [{ id, sort_order }, ...]
    if (!Array.isArray(items)) return res.status(400).json({ error: "items must be an array" });

    try {
        for (let item of items) {
            await pool.query("UPDATE products SET sort_order = $1 WHERE id = $2", [item.sort_order, item.id]);
        }
        res.json({ message: "Reordered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        res.json({
            users: parseInt((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count),
            lists: parseInt((await pool.query('SELECT COUNT(*) FROM lists')).rows[0].count),
            products: parseInt((await pool.query('SELECT COUNT(*) FROM products')).rows[0].count)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT u.id, u.username, u.role, u.created_at, COUNT(l.id) as list_count FROM users u LEFT JOIN lists l ON u.id = l.user_id GROUP BY u.id ORDER BY u.created_at DESC`);
        res.json({ users: result.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: "User deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
