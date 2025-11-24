const { cmd } = require("../command");
const { ytmp4, ytmp3 } = require("@vreden/youtube_scraper"); 
const yts = require("yt-search");
const axios = require('axios'); 
const { sleep } = require("../lib/functions");

// --- Core Helper Function for Download ---
async function downloadYoutubeVreden(url, format, zanta, from, mek, reply, data) {
    if (!url) return reply("❌ Invalid YouTube URL provided.");
    
    // ... [Duration Check Logic - පෙර කේතයේ තිබූ පරිදිම තබා ගන්න] ...
    
    try {
        let finalData;
        let quality = (format === 'mp4') ? '360' : '192'; // 360p පමණක් උත්සාහ කරන්න (සරල කිරීම)
        
        reply(`*Starting download (${format.toUpperCase()}):* ${data.title} \n> Attempting quality: ${quality}p 📥`);
        await sleep(1000); 

        // --- 1. Scraper Link ලබා ගැනීම ---
        if (format === 'mp4') {
            finalData = await ytmp4(url, quality);
        } else if (format === 'mp3') {
            finalData = await ytmp3(url, quality);
        }

        if (!finalData || !finalData.download || !finalData.download.url) {
             return reply(`*❌ Download Failed!* Reason: Could not get a valid download URL from the scraper. (Code: 202)`);
        }

        const downloadUrl = finalData.download.url;
        
        // --- 2. Download Link එකෙන් Buffer එක Fetch කිරීම (Axios භාවිතයෙන්) ---
        // මෙමගින් Baileys හි Stream Fetch Error එක මඟ හැරේ
        const response = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            // Timeout එකක් දීම සුදුසුයි
            timeout: 60000 // 60 seconds
        });
        
        const mediaBuffer = response.data; // වීඩියෝව Buffer එකක් ලෙස ලබා ගනී

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return reply("*❌ Download Failed!* Reason: Downloaded file is empty or link expired rapidly. 😔");
        }

        const caption = `*Download Complete (${format.toUpperCase()})!* \n\n🎬 Title: ${data.title} \n⭐ Quality: ${quality}p`;
        
        // --- 3. Buffer එක Chat එකට යැවීම ---
        if (format === 'mp4') {
            await zanta.sendMessage(
                from, 
                { 
                    video: mediaBuffer, // Buffer එක යවයි
                    caption: caption,
                    mimetype: 'video/mp4' 
                }, 
                { quoted: mek }
            );
        } else if (format === 'mp3') {
             await zanta.sendMessage(
                from, 
                { 
                    audio: mediaBuffer, // Buffer එක යවයි
                    caption: caption,
                    mimetype: 'audio/mpeg' 
                }, 
                { quoted: mek }
            );
        }

        return reply(`> *Download Complete!* ${format === 'mp4' ? '🎞️' : '🎶'}✅`);

    } catch (e) {
        console.error(`Vreden Download Error (${format}):`, e);
        // Link Expired Error එක මෙතැනින් හසුරුවනු ඇත
        reply(`*❌ Download Failed!* \n\n*Reason:* Download link expired, Network Error, or Timeout. 😔`);
    }
}

// ... [Commands $ytmp4 and $ytmp3 - පෙර තිබූ පරිදිම තබා ගන්න] ...
