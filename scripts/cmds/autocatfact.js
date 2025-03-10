const axios = require('axios');
const moment = require('moment-timezone');

module.exports.config = {
  name: "reactcat",
  version: "1.0.0",
  role: 0,
  author: "Makoy&Mark",
  description: "Automatically sends cat facts and images to groups every 1 hour.",
  category: "AutoCatFact",
  countDown: 3,
};

module.exports.onLoad = async ({ api }) => {
  let isSending = false;

  const introduceApp = async () => {
    if (isSending) return;
    isSending = true;

    try {
      const catFactResponse = await axios.get('https://rest-api.joshuaapostol.site/cat-fact');
      const catFact = catFactResponse.data.data[0];

      const catImageResponse = await axios.get('https://rest-api.joshuaapostol.site/cat-image');
      const catImageUrl = catImageResponse.data.url;

      const message = `😸: FACTS ABOUT CATS\n\n— ${catFact}`;

      const threads = await api.getThreadList(25, null, ['INBOX']);
      for (const thread of threads) {
        if (thread.isGroup && thread.name !== thread.threadID) {
          const imageStream = await axios({
            method: 'get',
            url: catImageUrl,
            responseType: 'stream',
          });

          await api.sendMessage({ body: message, attachment: imageStream.data }, thread.threadID);
        }
      }
    } catch (error) {
      console.error('Error sending cat fact:', error);
    } finally {
      isSending = false;
    }
  };

  const checkTimeAndSendCatFact = () => {
    const now = moment().tz('Asia/Manila');
    const currentMinute = now.minutes();
    const currentHour = now.hours();

    // Schedule to run every 1 hour
    if (currentMinute === 0) {
      introduceApp();
    }

    const nextHour = moment().add(1, 'hour').startOf('hour');
    const delay = nextHour.diff(moment());
    setTimeout(checkTimeAndSendCatFact, delay);
  };

  checkTimeAndSendCatFact();
};

module.exports.onStart = () => {};
