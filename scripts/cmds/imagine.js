const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: 'imagine',
    aliases: [],
    version: '1.0',
    author: 'Mark',
    countDown: 10,
    role: 0,
    shortDescription: 'Generate an image',
    longDescription: 'Generate an image using different AI models',
    category: 'ai',
    guide: '{pn} prompt | model (sxdl/poli/fluxschnell/art)',
  },
  onStart: async function ({ api, args, message, event }) {
    const path = __dirname + '/cache/image.png';
    const input = args.join(' ');
    const [prompt, model = 'sxdl'] = input.split('|').map(item => item.trim());
    const tid = event.threadID;
    const mid = event.messageID;

    if (!prompt) {
      return api.sendMessage('Please provide a prompt and optionally a model (sxdl/poli/fluxschnell/art)', tid, mid);
    }

    const modelEndpoints = {
      sxdl: 'https://api.shizuki.linkpc.net/api/sxdl',
      poli: 'https://api.shizuki.linkpc.net/api/poli',
      fluxschnell: 'https://api.shizuki.linkpc.net/api/fluxschnell',
      art: 'https://api.shizuki.linkpc.net/api/art'
    };

    const selectedEndpoint = modelEndpoints[model.toLowerCase()];

    if (!selectedEndpoint) {
      return api.sendMessage('Invalid model. Please choose from: sxdl, poli, fluxschnell, art', tid, mid);
    }

    try {
      api.sendMessage('⏳ Generating image...', tid, mid);
      
      const url = `${selectedEndpoint}?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      fs.writeFileSync(path, response.data);
      
      await api.sendMessage(
        { attachment: fs.createReadStream(path) },
        tid,
        () => fs.unlinkSync(path),
        mid
      );
    } catch (error) {
      return api.sendMessage(`Failed to generate image: ${error.message}`, tid, mid);
    }
  }
};
