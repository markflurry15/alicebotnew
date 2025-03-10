const axios = require("axios");
const prefix = global.GoatBot.config.prefix;
module.exports = {
  config: {
    name: 'ai',
    usePrefix: false,
    category: 'ai',
    author: 'renz'
  },
  onStart: function(){},
  onChat: async function({event,message,api}) {
    const prefixRegex = new RegExp(`^${prefix}ai`)
    if(event.body.toLowerCase()?.match(prefixRegex) || /^ai/.test(event.body.toLowerCase())) {

      try{
      const prompt = event.body?.replace(/^ai/i, '').trim();
        if(!prompt) return message.reply("No prompt provided")

       const {data} = await axios.get("https://api.shizuki.linkpc.net/api/gpt-3.5-turbo?", {params: {
        prompt,
        uid: event.senderID
      }})
      message.reply(data.response)
        } catch (error) {
        console.error(error);
        message.reply("An error occured.")
      }


      
    }
  }
      }
