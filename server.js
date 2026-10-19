
const http = require("node:http");

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN ||
  "https://ayron-shop-landing.onrender.com";

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

 if (req.method === "GET" && req.url.split("?")[0].replace(/\/+$/, "") === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method !== "POST" || req.url !== "/order") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: false, error: "Not found" }));
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: false, error: "Server not configured" }));
  }

  let body = "";

  req.on("data", chunk => {
    body += chunk;
    if (body.length > 10000) req.destroy();
  });

  req.on("end", async () => {
    try {
      const data = JSON.parse(body || "{}");
      const name = String(data.name || "").trim().slice(0, 100);
      const phone = String(data.phone || "").trim().slice(0, 40);
      const size = String(data.size || "").trim().slice(0, 30);
      const color = String(data.color || "").trim().slice(0, 40);

      if (!name || !phone || !size || !color) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Fill in all fields" }));
      }

      const message =
        "🛍 НОВЕ ЗАМОВЛЕННЯ — AYRON SHOP\n\n" +
        "Товар: Костюм Soft Shell\n" +
        "Ім’я: " + name + "\n" +
        "Телефон: " + phone + "\n" +
        "Розмір: " + size + "\n" +
        "Колір: " + color + "\n" +
        "Ціна: 2 100 грн";

      const response = await fetch(
        "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        console.error("Telegram error:", result.description);
        res.writeHead(502, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Telegram send failed" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error("Request error:", error.message);
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: false, error: "Invalid request" }));
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("AYRON SHOP Telegram server started on port " + PORT);
});
