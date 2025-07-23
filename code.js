const express = require('express');
const crypto = require('crypto');
const morgan = require('morgan');
const fetch = require('node-fetch'); 

const app = express();
app.use(express.json());
app.use(morgan('combined'));
const urls = {};

function generateShortCode() {
    return crypto.randomBytes(4).toString('hex');
}

// Helper function to log errors
async function logError(message, packageName = "handler") {
    try {
        await fetch('http://20.244.56.144/evaluation-service/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stack: "backend",
                level: "warn",
                package: packageName,
                message
            })
        });
    } catch (err) {
        console.error("Failed to log error:", err.message);
    }
}

app.post('/shorturls', async (req, res) => {
    const { url, expiry } = req.body;
    if (!url || typeof url !== 'string') {
        await logError('received string, expected bool');
        return res.status(400).json({ error: 'Invalid URL' });
    }
    const shortCode = generateShortCode();
    const now = Date.now();
    urls[shortCode] = {
        url,
        createdAt: now,
        expiry: expiry ? now + expiry * 1000 : null,
        visits: 0
    };
    res.status(201).json({
        shortlink: http://localhost:3000/shorturls/${shortCode}
    });
});

app.get('/shorturls/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    const entry = urls[shortCode];
    if (!entry) {
        await logError('Shortlink not found');
        return res.status(404).json({ error: 'Shortlink not found' });
    }
    if (entry.expiry && Date.now() > entry.expiry) {
        await logError('Shortlink expired');
        return res.status(410).json({ error: 'Shortlink expired' });
    }
    entry.visits += 1;
    res.redirect(entry.url);
});

app.get('/shorturls/:shortCode/stats', (req, res) => {
    const { shortCode } = req.params;
    const entry = urls[shortCode];
    if (!entry) {
        return res.status(404).json({ error: 'Shortlink not found' });
    }
    res.json({
        url: entry.url,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiry: entry.expiry ? new Date(entry.expiry).toISOString() : null,
        visits: entry.visits
    });
});

app.listen(3000, () => {
    console.log('URL Shortener service running on port 3000');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
