const { getTime } = global.utils;
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const request = require('request');

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "1.7",
        author: "NTKhang",
        category: "events"
    },

    langs: {
        vi: {
            session1: "sáng",
            session2: "trưa",
            session3: "chiều",
            session4: "tối",
            welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
            multiple1: "bạn",
            multiple2: "các bạn",
            defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!\nCurrent date and time in Manila: {dateTime}\nBạn là thành viên thứ {position} của nhóm này.\nTổng số thành viên: {membersCount}\nTổng số quản trị viên: {adminsCount}"
        },
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",
            welcomeMessage: "(⁠✿⁠ ⁠♡⁠‿⁠♡⁠) | Thank you for inviting me to the group 🎀\nthis is my prefix: %1\nthis bot for educational purposes only.",
            multiple1: "you",
            multiple2: "you guys",
            defaultWelcomeMessage: `(⁠つ⁠≧⁠▽⁠≦⁠)⁠つ | Hello {userName} 🎀.\n\nWelcome to the {boxName} group chat, free to ask anything but for educational purposes only.\n\nThis group chat is for educational purposes only. Please respect these rules to keep the space positive and productive.\nHere's the All GC RULES:\n— Respect All Members: Treat everyone with courtesy and kindness.\n— No Bullying or Harassment: This is a safe space. Be respectful and mindful of others.\n— No Bad Words or Uncomfortable Language: Keep the conversation appropriate for all.\n— No Spamming: Stick to relevant topics and share valuable information.\n— Keep the Group Format: Don't change the name, cover photo, theme, or emojis.\n— Keep Your Nickname: Avoid changing your nickname in the chat.\n\nConsequences:\n\nWarnings (⚠️): You will receive warnings for breaking any of the rules.\nBanned (🚫): After u have 3 warnings, you will be banned from the group chat and removed.\n\nif u don't know how to use a bot here's a tutorial:https://www.facebook.com/100020946066095/posts/pfbid0kcVHEu7BUJ492sdvigaShbxhLBQXt8GiyTHS593dx6PG73An9MTx1MacDDHo2q8Zl/\n\nhave a nice {session} 😊\n\nName | {userName}\nDate and time added | {dateTime}\nTotal members | {membersCount}\nTotal admins | {adminsCount}`
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType !== "log:subscribe") return;

        const { threadID } = event;
        const { nickNameBot } = global.GoatBot.config;
        const prefix = global.utils.getPrefix(threadID);
        const dataAddedParticipants = event.logMessageData.addedParticipants;

        // If new member is bot
        if (dataAddedParticipants.some(item => item.userFbId === api.getCurrentUserID())) {
            if (nickNameBot) {
                api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
            }
            return message.send(getLang("welcomeMessage", prefix));
        }

        // Initialize temp data for this thread if not exist
        if (!global.temp.welcomeEvent[threadID]) {
            global.temp.welcomeEvent[threadID] = {
                joinTimeout: null,
                dataAddedParticipants: []
            };
        }

        // Push new members to array and clear/set timeout
        global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
        clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

        global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
            const threadData = await threadsData.get(threadID);
            if (threadData.settings.sendWelcomeMessage === false) return;

            const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
            const dataBanned = threadData.data.banned_ban || [];
            const threadName = threadData.threadName;
            const threadInfo = await api.getThreadInfo(threadID);
            const groupIcon = threadInfo.imageSrc || 'https://i.ibb.co/G5mJZxs/rin.jpg'; // Fallback icon
            const mentions = [];

            // Filter out banned users
            const validParticipants = dataAddedParticipants.filter(user => !dataBanned.some(ban => ban.id === user.userFbId));
            if (validParticipants.length === 0) return;

            // Ensure the cache folder exists
            const cacheFolder = path.resolve(__dirname, 'cache');
            if (!fs.existsSync(cacheFolder)) {
                fs.mkdirSync(cacheFolder);
            }

            // List of background images
            const backgrounds = [
                "https://i.imgur.com/XHk4u8N.jpeg",
                "https://i.imgur.com/XHk4u8N.jpeg"
            ];

            // Function to get a random background URL
            const getRandomBackground = () => backgrounds[Math.floor(Math.random() * backgrounds.length)];

            // Function to get session name
            const getSessionName = () => {
                const hours = getTime("HH");
                return hours <= 10 ? getLang("session1") : hours <= 12 ? getLang("session2") : hours <= 18 ? getLang("session3") : getLang("session4");
            };

            // Function to get the ordinal suffix for a number
            const getOrdinalSuffix = (i) => {
                const j = i % 10, k = i % 100;
                if (j == 1 && k != 11) return i + "st";
                if (j == 2 && k != 12) return i + "nd";
                if (j == 3 && k != 13) return i + "rd";
                return i + "th";
            };

            const sendWelcomeMessage = async (user, position) => {
                const userName = user.fullName;
                const userId = user.userFbId;
                const dateTime = moment().tz('Asia/Manila').format('MMMM Do YYYY, h:mm:ss a');
                const membersCount = threadInfo.participantIDs.length;
                const adminsCount = threadInfo.adminIDs.length;

                let welcomeMessage = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");

                welcomeMessage = welcomeMessage
                    .replace(/\{userName\}|\{userNameTag\}/g, userName)
                    .replace(/\{boxName\}|\{threadName\}/g, threadName)
                    .replace(/\{multiple\}/g, getLang("multiple1"))
                    .replace(/\{session\}/g, getSessionName())
                    .replace(/\{dateTime\}/g, dateTime)
                    .replace(/\{membersCount\}/g, membersCount)
                    .replace(/\{adminsCount\}/g, adminsCount)
                    .replace(/\{position\}/g, getOrdinalSuffix(position));

                const form = { body: welcomeMessage, mentions: [{ tag: userName, id: userId }] };

                // Generate welcome image
                const background = getRandomBackground();
                const url = `https://api.joshweb.click/canvas/welcome?name=${encodeURIComponent(userName)}&groupname=${encodeURIComponent(threadName)}&groupicon=${encodeURIComponent(groupIcon)}&member=${membersCount}&uid=${userId}&background=${encodeURIComponent(background)}`;
                const filePath = path.resolve(cacheFolder, `${userId}.jpg`);

                return new Promise((resolve, reject) => {
                    request(url)
                        .pipe(fs.createWriteStream(filePath))
                        .on('close', () => {
                            form.attachment = [fs.createReadStream(filePath)];
                            message.send(form);
                            resolve();
                        })
                        .on('error', reject);
                });
            };

            // Send welcome messages one by one
            for (const [index, user] of validParticipants.entries()) {
                await sendWelcomeMessage(user, threadInfo.participantIDs.length - validParticipants.length + index + 1);
            }

            delete global.temp.welcomeEvent[threadID];
        }, 1500);
    }
};
