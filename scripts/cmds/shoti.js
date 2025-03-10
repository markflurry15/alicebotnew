const axios = require("axios");
const fs = require("fs");
const request = require("request");

module.exports = {
  config: {
    name: "shoti",
    description: "Fetch a short video from Shoti",
    category: "media",
    author: "Markytot",
  },

  onStart: async function ({ message, api, event }) {
    message.reply("Sending please wait...");

    try {
      const apiKey = "shipazu";
      const response = await axios.get(
        `https://betadash-shoti-yazky.vercel.app/shotizxx?apikey=${apiKey}`
      );

      if (
        response.data &&
        response.data.shotiurl &&
        response.data.username &&
        response.data.nickname &&
        response.data.duration &&
        response.data.region
      ) {
        const videoUrl = response.data.shotiurl;
        const filePath = __dirname + "/tmp/shoti.mp4";

        const file = fs.createWriteStream(filePath);
        const rqs = request(encodeURI(videoUrl));

        rqs.pipe(file);

        file.on("finish", async () => {
          const username = response.data.username;
          const nickname = response.data.nickname;
          const duration = response.data.duration;
          const region = response.data.region;

          await message.reply({
            body: `[ 🎀 | SHOTI ]
👤: Username: @${username}\n🗣️: Nickname: ${nickname}\n⏱️: Duration: ${duration} seconds\n⛳: Region: ${region}`,
            attachment: fs.createReadStream(filePath),
          });

          fs.unlinkSync(filePath);
        });
      } else {
        message.reply("No video URL found in the API response.");
      }
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while fetching the video.");
    }
  },
};
