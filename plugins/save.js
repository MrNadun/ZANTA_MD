const { cmd } = require("../command");

cmd(
    {
        pattern: "save",
        react: "✅",
        desc: "Resend Status or One-Time View Media",
        category: "general",
        filename: __filename,
    },
    async (
        zanta,
        mek,
        m,
        {
            from,
            quoted,
            reply,
            // You can destructure more variables if needed, but 'quoted' is the key here
        }
    ) => {
        try {
            // Check if the user replied to a message
            if (!quoted) {
                return reply("*Please reply to the Status, One-Time View, or any Media message you want to save/resend!* 🧐");
            }

            // --- Check for Status Media (STORIES) ---
            if (quoted.isStatus) {
                // If it's a status, the media is available in the 'quoted' object
                // Resend the media with a caption
                
                await zanta.copyNForward(from, quoted.fakeObj, { 
                    caption: "*✅ Saved and Resent from Status!*",
                    quoted: mek // Optional: quote the original 'save' message
                });
                
                return reply("*Status media successfully resent!* 🥳");
            }

            // --- Check for One-Time View Media (OTV) ---
            if (quoted.isViewOnce) {
                // OTV media is a special type of message where the content is hidden.
                // The library provides a way to extract the media from a View Once message (quoted.fakeObj).
                
                // Note: The message type (image/video) is in quoted.fakeObj.mtype
                
                await zanta.copyNForward(from, quoted.fakeObj, {
                    caption: "*📸 Saved and Resent from One-Time View!*",
                    quoted: mek // Optional: quote the original 'save' message
                });
                
                return reply("*One-Time View media successfully saved and resent!* 💾");
            }
            
            // --- Check for Regular Media (Image/Video/Audio/Document) ---
            // This handles any other regular media in the chat that the user wants to resend.
            if (quoted.mtype.includes('imageMessage') || 
                quoted.mtype.includes('videoMessage') || 
                quoted.mtype.includes('audioMessage') || 
                quoted.mtype.includes('documentMessage')) {

                await zanta.copyNForward(from, quoted.fakeObj, {
                    caption: "*💾 Saved and Resent!*",
                    quoted: mek
                });

                return reply("*Media successfully resent!* ✨");
            }
            
            // If it's not a Status, OTV, or any recognized media type
            return reply("*The replied message does not contain any Status, One-Time View, or recognizable Media!* 🤷‍♂️");

        } catch (e) {
            console.error(e);
            reply(`*Error saving media:* ${e.message || e}`);
        }
    }
);
