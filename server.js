const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/fetch-terabox", async (req, res) => {
  const { url } = req.query;

  const validDomains = ["terabox.com", "teraboxapp.com", "bit.ly"];
  if (!url || !validDomains.some(domain => url.includes(domain))) {
    return res.status(400).json({ error: "Invalid or unsupported Terabox URL" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    const html = await page.content();
    const scriptContent = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const dataScript = scripts.find(s => s.textContent.includes("window.__DATA__"));
      return dataScript ? dataScript.textContent : null;
    });

    await browser.close();

    if (scriptContent) {
      const match = scriptContent.match(/window\.__DATA__\s*=\s*(\{.+?\});/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        return res.json({ data });
      }
    }

    res.status(500).json({ error: "Failed to extract video metadata" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch the Terabox link",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
