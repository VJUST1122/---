const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const fs = require('fs');
const commands = {};

fs.readdirSync('./commands').forEach(file => {
  const cmd = require(`./commands/${file}`);
  commands[cmd.command] = cmd;
});

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const conn = makeWASocket({ auth: state, version });
  conn.ev.on('connection.update', update => {
    const { qr, connection } = update;
    if (qr) console.log('Scan QR:', qr);
    if (connection === 'open') console.log('✔️ Connected');
  });
  conn.ev.on('creds.update', saveState);

  conn.ev.on('messages.upsert', async m => {
    if (!m.messages) return;
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const from = msg.key.remoteJid;

    if (!text?.startsWith('/')) return;
    const [cmd, ...rest] = text.slice(1).split(' ');
    const handler = commands[cmd];
    if (handler) handler.execute(conn, msg, rest.join(' '));
  });
}

startBot();