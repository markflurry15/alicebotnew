const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "flag",
    aliases: ["flagGame"],
    version: "3.0",
    author: "Dipto",
    countDown: 0,
    role: 0,
    description: {
      en: "Guess the flag name",
    },
    category: "game",
    guide: {
      en: "{pn}",
    },
  },

  onStart: async function ({ api, args, event, threadsData, usersData }) {
    try {
      if (!args[0]) {
        const response = await axios.get(
          `${await baseApiUrl()}/flagGame?randomFlag=random`,
        );
        const { link, country } = response.data;
        await api.sendMessage(
          {
            body: "Guess this flag name.",
            attachment: await global.utils.getStreamFromURL(link),
          },
          event.threadID,
          (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              link,
              country,
              attempts: 0,
            });
          },
          event.messageID,
        );
      } else if (args[0] === "list") {
        const threadData = await threadsData.get(event.threadID);
        const { data } = threadData;
        const flagWins = data.flagWins || {};

        const flagStatsArray = Object.entries(flagWins);
        flagStatsArray.sort((a, b) => b[1] - a[1]);

        let message = "Flag Game Rankings:\n\n";
        let i = 0;
        for (const [userID, winCount] of flagStatsArray) {
          const userName = await usersData.getName(userID);
          message += `${i + 1}. ${userName}: ${winCount} wins\n`;
          i++;
        }

        return api.sendMessage(message, event.threadID, event.messageID);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      api.sendMessage(
        `Error: ${error.message}`,
        event.threadID,
        event.messageID,
      );
    }
  },

  onReply: async function ({ api, event, Reply, usersData, threadsData }) {
    const { country, attempts } = Reply;
    const maxAttempts = 3;
    if (event.type == "message_reply") {
      const reply = event.body.toLowerCase();
      const getCoin = 2 * 420;
      const getExp = 2 * 300;

      if (attempts >= maxAttempts) {
        await api.sendMessage(
          "🚫 | You have reached the maximum number of attempts (3).",
          event.threadID,
          event.messageID,
        );
        return;
      }

      if (isNaN(reply)) {
        if (reply == country.toLowerCase()) {
          try {
            await api.unsendMessage(Reply.messageID);
            const userData = await usersData.get(event.senderID);

            await usersData.set(event.senderID, {
              money: userData.money + getCoin,
              exp: userData.exp + getExp,
              data: userData.data,
            });

            const grp = await threadsData.get(event.threadID);
            const userID = event.senderID;

            if (!grp.data.flagWins) {
              grp.data.flagWins = {};
            }

            if (!grp.data.flagWins[userID]) {
              grp.data.flagWins[userID] = 0;
            }

            grp.data.flagWins[userID] += 1;
            await threadsData.set(event.threadID, grp);

            const message = `✅ | Correct answer!\nYou have earned ${getCoin} coins and ${getExp} exp.`;
            await api.sendMessage(message, event.threadID, event.messageID);
          } catch (err) {
            console.error("Error updating user data:", err.message);
            await api.sendMessage(
              "There was an error updating your balance. Please try again later.",
              event.threadID,
              event.messageID
            );
          }
        } else {
          Reply.attempts += 1;
          global.GoatBot.onReply.set(Reply.messageID, Reply);
          api.sendMessage(
            `❌ | Wrong Answer. You have ${maxAttempts - Reply.attempts} attempts left.\n✅ | Try Again baby!`,
            event.threadID,
            event.messageID,
          );
        }
      }
    }
  },
};