// Latest Autocass
const axios = require("axios");
let status = true;

module.exports = {
  config: {
    name: "autocass",
    version: "1.0",
    author: "LiANE @nealianacagara 🐸🤌 × Mark i fixed the syntax errors.",
    role: 0,
    category: "Ai-Chat",
    shortDescription: {
      en: ` `,
    },
    longDescription: {
      en: ` `,
    },
    guide: {
      en: "{pn} [query]",
    },
  },
  onStart({ message }) {
    // this is intentionally left empty :)
  },
  async onChat({ message, event, api }) {
    const timeA = Date.now();
    if (!status) return;
    try {
      event.prefixes = ["#"];
      //event.strictPrefix = true;
      if (
        event.type === "message_reply" &&
        api.getCurrentUserID() === event.messageReply.senderID
      ) {
        return;
      }
      const response = await axios.get(
        "https://cassidyredux.onrender.com/postWReply",
        { params: event }
      );
      const {
        result: { body, messageID },
        status: estatus,
        result,
      } = response.data;
      if (estatus === "fail") {
        return;
      }
      const timeB = Date.now();
      // Reply with the formatted output
      message.reply(body + `\n\nPing: ${timeB - timeA}ms`, (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "autocass",
          author: event.senderID,
          result,
        });
      });
    } catch (error) {
      // don't do anything
    }
  },
  async onReply({ Reply, message, event }) {
    const timeA = Date.now();
    const { author, result: messageReply } = Reply;
    messageReply.body = "";
    event.prefixes = ["#"];
    event.strictPrefix = true;
    const response = await axios.get(
      "https://cassidyredux.onrender.com/postWReply",
      { params: { ...event, messageReply } }
    );
    const {
      result: { body, messageID },
      status: estatus,
      result,
    } = response.data;
    if (estatus === "fail") {
      return;
    }
    const timeB = Date.now();
    // Reply with the formatted output
    message.reply(body + `\n\nPing: ${timeB - timeA}ms`, (_, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "autocass",
        author: event.senderID,
        result,
      });
    });
  },
};
