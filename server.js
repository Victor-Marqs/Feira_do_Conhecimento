// server.js — CommonJS, com logger + OpenAI integrado
const path = require("path");
const express = require("express");

// 1) CRIA O APP PRIMEIRO!
const app = express();

// 2) MIDDLEWARES BÁSICOS
app.use(express.json());

// 3) LOGGER (diagnóstico)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// 4) ESTÁTICOS E ROTAS BÁSICAS
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (_req, res) => res.send("OK"));
app.get("/api/ping", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 5) OPENAI (carrega .env e cria client)
require("dotenv").config();
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 6) ENDPOINT REAL DO CHAT (usa OpenAI)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Campo 'messages' precisa ser um array." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada no .env" });
    }

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "Você é um assistente que responde em português, claro e objetivo." },
        ...messages
      ]
    });

    const reply = (resp.output_text || "").trim();
    if (!reply) return res.status(502).json({ error: "Resposta vazia da OpenAI" });

    console.log("✅ OpenAI respondeu");
    res.json({ reply });
  } catch (e) {
    console.error("❌ /api/chat erro:", e?.status || "", e?.message || e);
    res.status(500).json({ error: e?.message || "Falha ao chamar a OpenAI" });
  }
});

// 7) SUBIR O SERVIDOR POR ÚLTIMO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("========================================");
  console.log(`Servidor no ar: http://localhost:${PORT}`);
  console.log("cwd:", process.cwd());
  console.log("file:", __filename);
  console.log("pid:", process.pid);
  console.log("========================================");
});
