const express = require('express');
const router = express.Router();
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, Browsers, delay } = require('@whiskeysockets/baileys');
const { uploadToMega } = require('./mega-handler');

function generateRandomID(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

router.get('/', async (req, res) => {
    const id = generateRandomID();
    const tempDir = path.join(__dirname, 'temp', id);
    const { state, saveCreds } = await useMultiFileAuthState(tempDir);

    try {
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !res.headersSent) {
                res.end(await QRCode.toBuffer(qr));
            }

            if (connection === 'open') {
                await delay(5000);
                const credsData = fs.readFileSync(path.join(tempDir, 'creds.json'), 'utf-8');
                const sessionID = "RANUX-BOT~" + Buffer.from(credsData).toString('base64');
                
                await sock.sendMessage(sock.user.id, { text: sessionID });

                const megaLink = await uploadToMega(sessionID);

                const confirmationMessage = `
*✅ QR Scanned & Session Paired!*

Your *KING RANUX* Session ID has been sent directly to you in the previous message.

For your convenience, a backup of the session file has also been uploaded to your Mega.nz account.

*🔗 Backup Link:*
${megaLink}

*⚠️ IMPORTANT:*
Do not share the Session ID or this link with anyone!

---
*Thank You For Using KING RANUX! 🤖*
> _Developed with ❤️ by Mr. Ransara_
`;
                await sock.sendMessage(sock.user.id, { text: confirmationMessage });

                await sock.ws.close();
                fs.rmSync(tempDir, { recursive: true, force: true });
                process.exit(0);
            }

            if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
                 fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });

    } catch (error) {
        console.error('QR process error:', error);
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (!res.headersSent) {
            res.status(500).send({ error: 'An unexpected error occurred.' });
        }
    }
});

module.exports = router;