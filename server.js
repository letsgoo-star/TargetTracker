import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

const EBAY_CLIENT_ID = "YOUR_EBAY_CLIENT_ID";
const EBAY_CLIENT_SECRET = "YOUR_EBAY_CLIENT_SECRET";

let accessToken = null;
let tokenExpires = 0;

// Get OAuth token
async function getEbayToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpires) return accessToken;

  const res = await fetch(
    "https://api.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    }
  );

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpires = now + data.expires_in * 1000;
  return accessToken;
}

// API endpoint for frontend
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q || "Target";
    const token = await getEbayToken();

    const ebayRes = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await ebayRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "eBay fetch failed" });
  }
});

// Fallback to index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));
