const axios = require('axios');

async function handleCommand({ api, message, event, args }) {
  const threadId = event.threadID;
  let imageUrl = '';
  const userPrompt = args.join(' ').trim().toLowerCase();

  if (!userPrompt && !imageUrl) {
    api.sendMessage('❌ Provide a question or an image along with a description for recognition.', threadId);
    return;
  }

  api.sendMessage('⌛ Processing your request, please wait...', threadId);

  try {
    if (!imageUrl) {
      if (event.messageReply && event.messageReply.attachments.length > 0) {
        imageUrl = event.messageReply.attachments[0].url;
      } else if (event.attachments && event.attachments.length > 0) {
        imageUrl = event.attachments[0].url;
      }
    }

    const textApiUrl = "http://sgp1.hmvhostings.com:25721/gemini";
    const imageRecognitionUrl = "https://api.joshweb.click/gemini";

    const useImageRecognition =
      imageUrl || ["recognize", "analyze", "analyst", "answer", "analysis"].some(term => userPrompt.includes(term));

    let responseMessage;

    if (useImageRecognition) {
      const imageApiResponse = await axios.get(imageRecognitionUrl, {
        params: { prompt: userPrompt, url: imageUrl || "" }
      });
      const imageRecognitionResponse = imageApiResponse.data.gemini || "❌ No response from Gemini Flash Vision.";
      responseMessage = `${imageRecognitionResponse}`;
    } else {
      const textApiResponse = await axios.get(textApiUrl, { params: { question: userPrompt } });
      const textResponse = textApiResponse.data.answer || "❌ No response from Gemini Advanced.";
      responseMessage = `${textResponse}`;
    }

    const responseTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: true });

    const finalResponse = `✨• 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗱𝘃𝗮𝗻𝗰𝗲𝗱 𝗔𝗜\n━━━━━━━━━━━━━━━━━━\n${responseMessage}\n━━━━━━━━━━━━━━━━━━\n📅 𝗗𝗮𝘁𝗲/𝗧𝗶𝗺𝗲: ${responseTime}`;

    await sendConcatenatedMessage(api, threadId, finalResponse);

  } catch (error) {
    console.error("❌ Error in Gemini command:", error);
    api.sendMessage(`❌ Error: ${error.message || "Something went wrong."}`, threadId);
  }
}

async function sendConcatenatedMessage(api, threadId, text) {
  const maxMessageLength = 2000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);

    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      api.sendMessage(message, threadId);
    }
  } else {
    api.sendMessage(text, threadId);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

const config = {
  name: 'geminiv3',
  description: 'Interact with Gemini AI advanced featuring vision',
  author: 'developer',
  version: '1.0',
  aliases: ['gemini'],
  category: 'ai',
  countDown: 5,
  role: 0,
  longDescription: 'Chat with Gemini AI.',
  guide: {
    en: '{p}geminiv3 {prompt}',
  },
};

module.exports = {
  config,
  handleCommand,
  onStart: function ({ api, message, event, args }) {
    return handleCommand({ api, message, event, args });
  },
  onReply: function ({ api, message, event, args }) {
    return handleCommand({ api, message, event, args });
  },
};
