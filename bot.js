const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🌸 HOUSE OF BHASHI BOT RUNNING 🌸");
});

app.listen(PORT, () => {
    console.log("Web server running on port " + PORT);
});

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["HOUSE OF BHASHI", "Chrome", "1.0"]
    });

    // 🔐 Save session
    sock.ev.on("creds.update", saveCreds);

    // 📱 Generate Pairing Code (ONLY first time)
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode("94788806757");
                console.log("📱 Your Pairing Code:", code);
                console.log("👉 Go to WhatsApp → Linked Devices → Link with phone number");
            } catch (e) {
                console.log("Pairing failed:", e.message);
            }
        }, 6000);
    }

    // 🔄 Connection Handling
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ HOUSE OF BHASHI BOT CONNECTED!");
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;

            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("🔁 Reconnecting...");
                startBot();
            } else {
                console.log("❌ Logged Out. Delete session folder and restart.");
            }
        }
    });

    // 📩 Message Listener
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

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
