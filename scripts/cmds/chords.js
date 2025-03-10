const axios = require("axios");

module.exports = {
  config: {
    name: "chords",
    version: "1.0",
    author: "developer",
    countDown: 5,
    role: 0,
    category: "music",
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ").trim();
    if (!query) {
      api.sendMessage("Please provide a song name or artist to search for chords!", event.threadID, event.messageID);
      return;
    }

    try {
      await fetchChords(api, event, query, 0);
    } catch (error) {
      console.error(`Error fetching chords for "${query}":`, error);
      api.sendMessage(`Sorry, there was an error getting the chords for "${query}"!`, event.threadID, event.messageID);
    }
  },
};

const apiConfigs = [
  {
    name: "Chords API",
    url: (query) => `https://markdevs-last-api-2epw.onrender.com/search/chords?q=${encodeURIComponent(query)}`,
  },
];

async function fetchChords(api, event, query, attempt) {
  if (attempt >= apiConfigs.length) {
    api.sendMessage(`Sorry, chords for "${query}" not found in all APIs!`, event.threadID, event.messageID);
    return;
  }

  const { name, url } = apiConfigs[attempt];
  const apiUrl = url(query);

  try {
    const response = await axios.get(apiUrl);
    const result = response.data.chord;

    if (result && result.chords) {
      const chordsMessage = `🎵 | Title: ${result.title}\n🎤 | Artist: ${result.artist}\n🎼 | Key: ${result.key}\n\n${result.chords}`;
      
      api.sendMessage(chordsMessage, event.threadID, event.messageID);

      if (result.url) {
        api.sendMessage(`You can also view the chords here: ${result.url}`, event.threadID, event.messageID);
      }
    } else {
      throw new Error("Chords not found");
    }
  } catch (error) {
    console.error(`Error fetching chords from ${name} for "${query}":`, error.message || error);
    await fetchChords(api, event, query, attempt + 1);
  }
}
