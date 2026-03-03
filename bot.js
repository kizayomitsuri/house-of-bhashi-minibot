const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

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
        const { connection, qr } = update;

        // 🔥 PRINT QR MANUALLY
        if (qr) {
            console.log("\n🌸 HOUSE OF BHASHI QR CODE 🌸\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ HOUSE OF BHASHI BOT CONNECTED!");
            console.log("👑 OWNER: ✠ KG84࿐");
        }

        if (connection === "close") {
            console.log("❌ Connection closed. Reconnecting...");
            startBot();
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const imagePath = path.join(__dirname, "media", "menu.jpg");

        if (text === ".menu") {
            if (!fs.existsSync(imagePath)) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: "⚠ Menu image not found in media folder!"
                });
            }

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
