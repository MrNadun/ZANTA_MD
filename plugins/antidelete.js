// This file should be placed in the folder where your event listeners/plugins are loaded.
// It relies on 'global.messages' cache provided by the ZANTA_MD core.

module.exports = zanta => {
  // Baileys 'messages.delete' event listener
  zanta.on('messages.delete', async (messageData) => {
    try {
      // 1. Basic checks
      if (!messageData || !messageData.keys || messageData.keys.length === 0) return;
      
      const deleteKey = messageData.keys[0]; 
      
      // Ignore if the bot deleted its own message
      if (deleteKey.fromMe) return;

      // 2. Fetch deleted message from cache
      // The message ID from the key is used to retrieve data from the global cache
      const deletedMessage = global.messages.get(deleteKey.id); 
      
      if (!deletedMessage) {
        // If the message wasn't in the cache, we can't recover the content.
        console.log("AntiDelete: Deleted message not found in cache (probably sent before bot started).");
        return;
      }

      // 3. Extract sender and chat info
      const isGroup = deleteKey.remoteJid.endsWith('@g.us');
      // The person who sent the original message
      const senderJid = deletedMessage.key.participant || deletedMessage.key.remoteJid; 
      const senderNumber = senderJid.replace('@s.whatsapp.net', '');

      let text = "Message Content Not Found"; // Default text

      // 4. Extract Message Content (Similar to ZANTA_MD's message processing logic)
      if (deletedMessage.message) {
        const messageType = Object.keys(deletedMessage.message)[0];
        const content = deletedMessage.message[messageType];
        
        switch (messageType) {
          case 'conversation':
          case 'extendedTextMessage':
            text = content.text || content.caption || 'No Text Content';
            break;
          case 'imageMessage':
            text = `PHOTO 🖼️`;
            if (content.caption) {
                text += `\n*Caption:* ${content.caption}`;
            }
            break;
          case 'videoMessage':
            text = `VIDEO 🎥`;
            if (content.caption) {
                text += `\n*Caption:* ${content.caption}`;
            }
            break;
          case 'stickerMessage':
            text = "STICKER 🌟";
            break;
          case 'documentMessage':
            text = `DOCUMENT 📄 (${content.fileName || 'No Name'})`;
            break;
          case 'audioMessage':
            text = "AUDIO 🎤";
            break;
          // Add more cases for other message types (e.g., location, contact) if needed.
          default:
            text = `UNSUPPORTED TYPE: ${messageType}`;
        }
      }
      
      // 5. Create and Send the Notification Message
      const deleteNotification = `
*🚫 MESSAGE DELETED!*
*👤 Sender:* @${senderJid.split('@')[0]}
*📱 Number:* ${senderNumber}
*💬 Chat Type:* ${isGroup ? 'Group Chat' : 'Private Chat'}
*🗑️ Deleted Content:*
--------------------------------
${text}
--------------------------------
      `;

      await zanta.sendMessage(
        deleteKey.remoteJid, // Send back to the original chat/group
        {
          text: deleteNotification,
          mentions: [senderJid] // Mention the user who deleted the message
        }
      );

    } catch (error) {
      console.error("Error in AntiDelete Plugin:", error);
    }
  });
};
