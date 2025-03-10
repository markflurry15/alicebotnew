const { getStreamFromURL } = global.utils; 

const DEFAULTS = {
avatar: "https://i.ibb.co/MNnPJH4/xva213.jpg",
emoji: "🧸",
theme: "958458032991397", // Default color
threadNames: {
"6447646505324786": "1 : school purpose only. ( don't use for nonsense )",
"7080236221991752": "2 : school purpose only. ( don't use for nonsense )",
"6107334396040371": "3 : school purpose only. ( don't use for nonsense )"
}
}; 

module.exports = {
config: {
name: "antichangeinfobox",
version: "1.1",
author: "coffee",
description: {
en: "Monitors thread property changes, saves initial settings, detects unauthorized changes, warns users, kicks offenders, and reverts changes."
},
category: "utility"
}, 

onStart: async () => {
// Empty onStart method
}, 

onEvent: async ({ api, event, threadsData, role }) => {
const { threadID, logMessageType, logMessageData, author } = event; 

const revertChanges = async (property, newValue) => {
switch (property) {
case "avatar":
await api.changeGroupImage(await getStreamFromURL(newValue), threadID);
break;
case "name":
await api.setTitle(newValue, threadID);
break;
case "theme":
await api.changeThreadColor(newValue || DEFAULTS.theme, threadID);
break;
case "emoji":
await api.changeThreadEmoji(newValue, threadID);
break;
}
}; 

try {
switch (logMessageType) {
case "log:thread-image":
if (role < 1 && api.getCurrentUserID() !== author) {
api.sendMessage("Unauthorized change detected in thread avatar. The bot will remove the user from the group.", threadID);
await kickUser(api, author, threadID);
await revertChanges("avatar", DEFAULTS.avatar);
}
break; 

case "log:thread-name":
if (DEFAULTS.threadNames[threadID]) { // Specific threadID check
if (role < 1 && api.getCurrentUserID() !== author) {
api.sendMessage("Unauthorized change detected in thread name. The bot will remove the user from the group.", threadID);
await kickUser(api, author, threadID);
await revertChanges("name", DEFAULTS.threadNames[threadID]); // Revert to default name
}
}
break; 

case "log:thread-color":
if (role < 1 && api.getCurrentUserID() !== author) {
api.sendMessage("⚠️ | Unauthorized change detected in thread theme. The bot will remove the user from the group.", threadID);
await kickUser(api, author, threadID);
await revertChanges("theme", DEFAULTS.theme);
}
break; 

case "log:thread-icon":
if (role < 1 && api.getCurrentUserID() !== author) {
api.sendMessage("⚠️ | Unauthorized change detected in thread emoji. The bot will remove the user from the group.", threadID);
await kickUser(api, author, threadID);
await revertChanges("emoji", DEFAULTS.emoji); // Default emoji to "😺"
}
break;
}
} catch (error) {
console.error("Error handling thread property changes:", error);
}
}
}; 

async function kickUser(api, userID, threadID) {
try {
await api.removeUserFromGroup(userID, threadID);
console.log("User removed successfully.");
} catch (error) {
console.error("Error removing user from group:", error);
}
}
