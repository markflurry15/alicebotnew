const { getTime } = global.utils;
const moment = require('moment-timezone');
const Jimp = require('jimp');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "leave",
        version: "2.0.0", // Updated version
        author: "ballsXbisaya",
        category: "events"
    },

    langs: {
        vi: {
            session1: "sáng",
            session2: "trưa",
            session3: "chiều",
            session4: "tối",
            leaveType1: "tự rời",
            leaveType2: "bị kick",
            defaultLeaveMessage: "{userName} đã {type} khỏi nhóm\nHiện tại có {currentMembers} thành viên trong nhóm"
        },
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",
            leaveType1: "left",
            leaveType2: "was kicked from",
            defaultLeaveMessage: "{userName} {type} the {threadName}\nCurrently, there are {currentMembers} members left in the group.\n\n🕊️ RIP 🕊️\n🕊️ {userName} 🕊️\n🕊️ FLYHIGH 🕊️"
        }
    },

    onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
        if (event.logMessageType !== "log:unsubscribe") return;

        const { threadID } = event;
        let threadData;

        try {
            threadData = await threadsData.get(threadID);
        } catch (error) {
            console.error("Error fetching thread data:", error);
            return;
        }

        if (!threadData || !threadData.settings || !threadData.settings.sendLeaveMessage) return;

        const leftParticipantFbId = event.logMessageData.leftParticipantFbId || event.logMessageData.userFbId;
        if (!leftParticipantFbId || leftParticipantFbId === api.getCurrentUserID()) return;

        // Fetch the current member count
        let thread;
        try {
            thread = await api.getThreadInfo(threadID);
        } catch (error) {
            console.error("Error fetching thread info:", error);
            return message.send({ body: "Failed to fetch thread information." });
        }
        const currentMembers = thread ? thread.participantIDs.length : 0;

        const threadName = threadData.threadName || "Unknown Thread";

        let userName;
        try {
            userName = await usersData.getName(leftParticipantFbId);
        } catch (error) {
            console.error("Error fetching user name:", error);
            userName = "Unknown";
        }

        // Prepare the leave message
        let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data || {};
        leaveMessage = leaveMessage
            .replace(/\{userName\}/g, userName)
            .replace(/\{type\}/g, leftParticipantFbId === event.author ? getLang("leaveType1") : getLang("leaveType2"))
            .replace(/\{threadName\}/g, threadName)
            .replace(/\{currentMembers\}/g, currentMembers);

        const backgrounds = [
            "https://i.imgur.com/pLcGr6b.jpeg",
            "https://i.imgur.com/VsCKx82.jpeg"
        ];
        const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        let outputPath;
        try {
            // Load the background image
            const { data: backgroundBuffer } = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
            const background = await loadImage(Buffer.from(backgroundBuffer));

            // Fetch avatar from Facebook using axios
            const accessToken = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
            const avatarUrl = `https://graph.facebook.com/${leftParticipantFbId}/picture?width=720&height=720&access_token=${accessToken}`;
            const { data: avatarBuffer } = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

            // Load and process avatar using Jimp
            const avatar = await Jimp.read(avatarBuffer);
            avatar.resize(200, 200).circle();
            const finalAvatarBuffer = await avatar.getBufferAsync(Jimp.MIME_PNG);
            const avatarImage = await loadImage(finalAvatarBuffer);

            // Create the canvas
            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');

            // Draw the background
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Draw the avatar
            const x = (canvas.width / 2) - (avatar.bitmap.width / 2);
            const y = 120;
            ctx.drawImage(avatarImage, x, y, avatar.bitmap.width, avatar.bitmap.height);

            // Add text
            const colors = ["#FF5733", "#33FF57", "#5733FF", "#FF33A1", "#33FFA1", "#FFA133", "#33A1FF", "#A133FF", "#FF5733", "#33FF57"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            ctx.font = 'bold 45px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = randomColor;

            // Glowing effect
            ctx.shadowColor = 'rgba(0, 0, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText(userName, canvas.width / 2, y + avatar.bitmap.height + 50);

            // Remove shadow for the next text
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';

            ctx.font = 'bold 35px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${userName} ${getLang(leftParticipantFbId === event.author ? "leaveType1" : "leaveType2")} the ${threadName}`, canvas.width / 2, y + avatar.bitmap.height + 100);

            // Add current members text
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`MEMBERS NOW 👾${currentMembers}👾.`, canvas.width / 2, y + avatar.bitmap.height + 140);

            // Save the image to a buffer
            outputPath = path.join(__dirname, 'cache', `${leftParticipantFbId}_leave.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);

            // Ensure the image file exists
            if (!fs.existsSync(outputPath)) {
                throw new Error('Failed to create the image.');
            }

            // Send the image and message
            await message.send({
                body: leaveMessage,
                attachment: fs.createReadStream(outputPath)
            });

        } catch (error) {
            console.error("Error creating leave image:", error);
            await message.send({
                body: leaveMessage
            });
        } finally {
            // Clean up the file after sending, even in case of an error
            if (outputPath && fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        }
    }
};
