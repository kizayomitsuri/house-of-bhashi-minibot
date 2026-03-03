const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🌸 HOUSE OF BHASHI BOT RUNNING 🌸");
});

app.listen(PORT, () => {
    console.log("Web server running on port " + PORT);
});

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection } = update;

        if (connection === "open") {
            console.log("✅ HOUSE OF BHASHI BOT CONNECTED!");
        }
    });

    if (!sock.authState.creds.registered) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Enter your WhatsApp number (947XXXXXXXX): ", async (number) => {
            const code = await sock.requestPairingCode(number);
            console.log("Your Pairing Code:", code);
            rl.close();
        });
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const imagePath = path.join(__dirname, "media", "menu.jpg");

        if (text === ".menu") {
            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(imagePath),
                caption: `
🌸 𝗛𝗢𝗨𝗦𝗘 𝗢𝗙 𝗕𝗛𝗔𝗦𝗛𝗜 🌸
━━━━━━━━━━━━━━
👗 Beautiful Baby Girl Frocks
✨ Premium Quality Ready To Wear

👑 BOT OWNER : ✠ KG84࿐
📞 OWNER NUMBER : 94788809151

━━━━━━━━━━━━━━
𝗥𝗘𝗔𝗗𝗬 𝗧𝗢 𝗪𝗘𝗔𝗥.....
`
            });
        }
    });
}

startBot();
