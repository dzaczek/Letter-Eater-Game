const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'public/audio/' });

// Serve static files from public directory
app.use(express.static('public'));

// Create audio directory endpoint
app.post('/create-audio-dir', (req, res) => {
    const audioDir = path.join(__dirname, 'public', 'audio');
    
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    res.json({ success: true });
});

// Proxy endpoint for Google Translate TTS
app.get('/tts-proxy', async (req, res) => {
    const { text, lang } = req.query;
    
    if (!text || !lang) {
        return res.status(400).json({ error: 'Missing text or language parameter' });
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}`;
    
    https.get(url, (ttsRes) => {
        // Forward the content type
        res.setHeader('Content-Type', ttsRes.headers['content-type']);
        
        // Pipe the response directly to our client
        ttsRes.pipe(res);
    }).on('error', (err) => {
        console.error('TTS proxy error:', err);
        res.status(500).json({ error: 'Failed to fetch TTS audio' });
    });
});

// Save audio file endpoint
app.post('/save-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const targetPath = path.join(__dirname, 'public', 'audio', fileName);

    // Move the uploaded file to the correct location
    fs.rename(req.file.path, targetPath, (err) => {
        if (err) {
            console.error('Error saving audio file:', err);
            return res.status(500).json({ error: 'Failed to save audio file' });
        }
        res.json({ success: true });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 