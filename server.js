const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/fetch-terabox", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes("terabox.com")) {
    return res.status(400).json({ error: "Invalid or missing Terabox URL" });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const scriptContent = $('script').map((i, el) => $(el).html()).get().find(text => text && text.includes('window.__DATA__'));

    if (scriptContent) {
      const match = scriptContent.match(/window\.__DATA__\s*=\s*(\{.+?\});/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        res.json({ data });
        return;
      }
    }

    res.status(500).json({ error: "Failed to extract video metadata" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the Terabox link", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
