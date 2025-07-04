const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory penyimpanan token berdasarkan kode
const tokenMap = new Map();

// Generate kode unik
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Endpoint generate kode untuk token
app.post('/generate-code', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token required' });
    }

    const code = generateCode();
    tokenMap.set(code, token);

    res.json({ success: true, code });
});

// Endpoint ambil token berdasarkan kode
app.get('/code/:code', (req, res) => {
    const { code } = req.params;
    const token = tokenMap.get(code);

    if (token) {
        return res.json({ token });
    } else {
        return res.status(404).json({ message: 'Code not found' });
    }
});

// Endpoint cek token Discord
app.post('/api/check', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ valid: false, message: 'Token required' });
    }

    try {
        // Coba validasi sebagai User Token
        const userRes = await fetch('https://discord.com/api/v9/users/@me', {
            headers: { Authorization: token }
        });

        if (userRes.ok) {
            const userData = await userRes.json();
            return res.json({ valid: true, type: 'user', data: userData });
        }

        // Kalau gagal, coba sebagai Bot Token
        const botRes = await fetch('https://discord.com/api/v9/applications/@me', {
            headers: { Authorization: `Bot ${token}` }
        });

        if (botRes.ok) {
            const botData = await botRes.json();
            return res.json({ valid: true, type: 'bot', data: botData });
        }

        return res.status(401).json({ valid: false, message: 'Invalid token' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ valid: false, message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
