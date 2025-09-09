const path = require("path");
const express = require("express");
const app = express();

require("dotenv").config();
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body ?? {};
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: "Responda em PT-BR, claro e objetivo." }, ...messages]
    });
    res.json({ reply: (resp.output_text || "").trim() });
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Falha na OpenAI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`On :${PORT}`));
