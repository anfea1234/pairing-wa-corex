const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ message: 'Nomor wajib diisi!' });

    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10) {
        return res.status(400).json({ message: 'Format nomor tidak valid!' });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode(cleanNumber);
            res.json({ code: code });
        } else {
            res.json({ message: 'Nomor ini sudah terdaftar!' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
