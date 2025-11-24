const { cmd } = require("../command");
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg'); // MP3 Conversion සඳහා අවශ්‍යයි
const { getRandom, sleep } = require("../lib/functions");
const fs = require('fs');

// --- Custom Headers (Bot Blocking මඟහැරීමට) ---
const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.youtube.com/',
};

// --- Core Helper Function for Download (MP4/MP3) ---
async function downloadYoutube(url, format, zanta, from, mek, reply) {
    if (!ytdl.validateURL(url)) {
        return reply("*Invalid YouTube URL provided.* 🔗");
    }

    let tempFilePath;
    let finalMp3Path;
    
    try {
        const info = await ytdl.getInfo(url, { requestOptions: { headers: customHeaders } });
        const title = info.videoDetails.title;
        
        reply(`*Starting download (${format.toUpperCase()}):* ${title} 📥`);
        await sleep(1000); 

        const stream = ytdl(url, {
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly',
            quality: format === 'mp4' ? 'highestvideo' : 'highestaudio',
            dlChunkSize: 0, 
            requestOptions: { headers: customHeaders },
        });

        tempFilePath = `${getRandom('.mp4')}`;
        
        // --- 1. Stream data Local File එකක් ලෙස Save කරයි ---
        await new Promise((resolve, reject) => {
            stream.pipe(fs.createWriteStream(tempFilePath))
                .on('finish', resolve)
                .on('error', (e) => reject(new Error(`Stream Error: ${e.message}`)));
        });

        if (format === 'mp3') {
            // --- 2. MP3 Conversion (FFmpeg) ---
            finalMp3Path = `${getRandom('.mp3')}`;
            
            await new Promise((resolve, reject) => {
                ffmpeg(tempFilePath)
                    .audioBitrate(128)
                    .save(finalMp3Path)
                    .on('end', () => {
                        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); 
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('FFmpeg Error:', err.message);
                        reject(new Error("FFmpeg conversion failed. Check FFmpeg installation."));
                    });
            });
            
            // --- 3. MP3 එක යවයි ---
            const mp3Buffer = fs.readFileSync(finalMp3Path);
            await zanta.sendMessage(from, { audio: mp3Buffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: mek });
            reply(`*Download Complete (MP3)!* 🎵✅`);
            if (fs.existsSync(finalMp3Path)) fs.unlinkSync(finalMp3Path); 

        } else if (format === 'mp4') {
            // --- 2. MP4 එක යවයි ---
            const videoBuffer = fs.readFileSync(tempFilePath);
            await zanta.sendMessage(from, { video: videoBuffer, caption: `*Download Complete (MP4)!* \n\nTitle: ${title}` }, { quoted: mek });
            reply(`> *Video Download Complete!* 🎞️✅`);
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); 
        }

    } catch (e) {
        console.error("YouTube Download Error:", e);
        
        let errorMessage = e.message.includes('FFmpeg conversion failed') ? 'FFmpeg is not installed or configured properly.' :
                           e.message.includes('403') ? 'Access Denied (Age/Copyright)' : 
                           'Unknown Stream/Network Error.';

        reply(`*❌ Download Failed!* \n\n*Reason:* ${errorMessage}`);

    } finally {
        // --- 4. File Cleanup (Ensuring no files are left behind) ---
        if (typeof tempFilePath !== 'undefined' && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                // Ignore cleanup error
            }
        }
        if (typeof finalMp3Path !== 'undefined' && fs.existsSync(finalMp3Path)) {
            try {
                fs.unlinkSync(finalMp3Path);
            } catch (err) {
                // Ignore cleanup error
            }
        }
    }
}

// --- $ytmp4 Command (Video Download) ---
cmd(
    {
        pattern: "ytmp4",
        alias: ["vid", "ytvideo"],
        react: "🎞️",
        desc: "Downloads a YouTube video as MP4.",
        category: "download",
        filename: __filename,
    },
    async (zanta, mek, m, { from, reply, q }) => {
        if (!q) return reply("*Please provide a YouTube link.* 🔗");
        await downloadYoutube(q, 'mp4', zanta, from, mek, reply);
    }
);

// --- $ytmp3 Command (Audio Download) ---
cmd(
    {
        pattern: "ytmp3",
        alias: ["audio", "ytaudio"],
        react: "🎶",
        desc: "Downloads a YouTube video as MP3 audio.",
        category: "download",
        filename: __filename,
    },
    async (zanta, mek, m, { from, reply, q }) => {
        if (!q) return reply("*Please provide a YouTube link.* 🔗");
        await downloadYoutube(q, 'mp3', zanta, from, mek, reply);
    }
);
