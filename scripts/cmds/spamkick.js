let messageCounts = {};
let bobaMessages = {};
const spamThreshold = 8;
const spamInterval = 20000; // 20 seconds
const bobaThreshold = 5;
const bobaInterval = 45000; // 45 seconds
const exemptedUserID = ["100024270410090","61554609641407"]; // UIDs to exempt from kick

module.exports = {
  config: {
    name: "spamkick",
    aliases: [],
    version: "1.0",
    author: "Jonell Magallanes & BLUE & kshitiz/coffee",
    countDown: 5,
    role: 0,
    shortDescription: "Automatically detect and act on spam",
    longDescription: "Automatically detect and act on spam",
    category: "owner",
    guide: "{pn}",
  },

  onStart: async function ({ api, event, args }) {
    api.sendMessage("This command functionality kicks the user when they are spamming in group chats", event.threadID, event.messageID);
  },

  onChat: function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    // Check if the sender is exempted from kick
    if (exemptedUserID.includes(senderID)) {
      return; // Do nothing if exempted user sends messages
    }

    // Initialize messageCounts and bobaMessages for the thread if they don't exist
    if (!messageCounts[threadID]) {
      messageCounts[threadID] = {};
    }
    if (!bobaMessages[threadID]) {
      bobaMessages[threadID] = {};
    }

    // Check for "🧸" messages within the bobaInterval
    if (body === "🧸") {
      if (!bobaMessages[threadID][senderID]) {
        bobaMessages[threadID][senderID] = {
          count: 1,
          timestamps: [Date.now()],
        };
      } else {
        const userBobaData = bobaMessages[threadID][senderID];
        const now = Date.now();

        // Remove timestamps older than the bobaInterval
        userBobaData.timestamps = userBobaData.timestamps.filter(timestamp => now - timestamp <= bobaInterval);
        userBobaData.timestamps.push(now);
        userBobaData.count = userBobaData.timestamps.length;

        if (userBobaData.count >= bobaThreshold) {
          api.sendMessage("🛡️ | Detected spamming '🧸' messages. The bot will remove the user from the group", threadID, messageID);

          api.removeUserFromGroup(senderID, threadID, (err) => {
            if (err) {
              console.error(`Failed to remove user ${senderID} from thread ${threadID}:`, err);
            }
          });

          delete bobaMessages[threadID][senderID];
          return;
        }
      }
    }

    // Initialize or update the message count and timer for the sender
    if (!messageCounts[threadID][senderID]) {
      messageCounts[threadID][senderID] = {
        count: 1,
        timer: setTimeout(() => {
          delete messageCounts[threadID][senderID];
        }, spamInterval),
      };
    } else {
      const userMessageData = messageCounts[threadID][senderID];
      userMessageData.count++;

      if (userMessageData.count > spamThreshold) {
        clearTimeout(userMessageData.timer);
        api.sendMessage("🛡️ | Detected spamming. The bot will remove the user from the group", threadID, messageID);

        api.removeUserFromGroup(senderID, threadID, (err) => {
          if (err) {
            console.error(`Failed to remove user ${senderID} from thread ${threadID}:`, err);
          }
        });

        delete messageCounts[threadID][senderID];
      } else {
        // Reset the timer for the current user after each message
        clearTimeout(userMessageData.timer);
        userMessageData.timer = setTimeout(() => {
          delete messageCounts[threadID][senderID];
        }, spamInterval);
      }
    }
  },
};
