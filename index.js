const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Routes
const qrRoute = require('./qr');
const pairRoute = require('./pair');

// Use Routes - Handlers for QR and Pairing
app.use('/qr_code_handler', qrRoute);
app.use('/pair_code_handler', pairRoute);

// Serve Static HTML Files for the user interface
app.get('/qr', (req, res) => res.sendFile(path.join(__dirname, 'qr.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'main.html')));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;