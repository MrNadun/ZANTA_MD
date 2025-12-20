const { cmd } = require("../command");

cmd({
    pattern: "jid",
    alias: ["myid", "userjid"],
    react: "🆔",
    desc: "Get user's JID or replied user's JID.",
    category: "main",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, isGroup, sender }) => {
    try {
        // Reply karapu message ekak thiyanawanam eyage JID eka gannawa
        // Nathnam message eka ewapu kenage JID eka gannawa
        let targetJid = m.quoted ? m.quoted.sender : sender;

        let jidMsg = `╭━─━─━─━─━╮\n┃ 🆔 *USER JID INFO* ┃\n╰━─━─━─━─━╯\n\n`;
        jidMsg += `👤 *User:* @${targetJid.split('@')[0]}\n`;
        jidMsg += `🎫 *JID:* ${targetJid}\n\n`;

        if (isGroup) {
            jidMsg += `🏢 *Group JID:* ${from}\n\n`;
        }

        jidMsg += `> *© ZANTA-MD ID FINDER*`;

        // Mention ekak ekka message eka yawamu
        await zanta.sendMessage(from, { 
            text: jidMsg, 
            mentions: [targetJid] 
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply("❌ JID එක ලබා ගැනීමට නොහැකි විය.");
    }
});
