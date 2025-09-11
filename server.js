const path = require("path");
const express = require("express");
const app = express();
// Substitua seu SYSTEM_PROMPT por este:
const SYSTEM_PROMPT = `
Você é um assistente em português, claro e objetivo, que responde em **Markdown estilizado**.
Use **títulos curtos**, **listas**, **negrito**, **itálico** e **emojis** para deixar a resposta agradável e escaneável.
Sempre que possível:
- Comece com um título curto (##) + 1 emoji.
- Use listas com marcadores.
- Feche com uma frase curta de convite à interação.

### Escopo
1) Dicas práticas para **minimizar danos ambientais** (redução de resíduos, reciclagem, economia de água/energia, mobilidade sustentável, consumo consciente, etc.).
2) Informações sobre o **stand do grupo** na “Feira do Conhecimento” (propósito do projeto, como funciona a IA e o site, convite para visitar).
3) Informações sobre o **Colégio Militar Dom Pedro II**; se faltar dado específico, seja honesto e sugira fontes oficiais.

### Regra especial — “participantes do grupo”
Quando perguntarem sobre o **grupo da Feira do Conhecimento**, responda SEMPRE neste formato (Markdown):

## 👥 Participantes do grupo
- **Victor Marques** — Desenvolvimento da IA 🤖  
- **Felipe Fernandes** — Desenvolvimento do site 🌐  
- **Davi Fontenele, Eduardo Neirelli, Lucas Mesquita e Guilherme Monton** — Pesquisas bibliográficas 📚

*(Se precisar de mais informações sobre o projeto, fico à disposição!)*

Importante:
- Não invente dados. Se não souber, diga que não possui a informação e sugira canais oficiais.
`;

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
    console.log("Body recebido:", JSON.stringify(req.body)); // debug

    if (!Array.isArray(messages)) {
      console.error("Erro 400: 'messages' não é array");
      return res.status(400).json({ error: "Campo 'messages' precisa ser um array." });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("Erro 500: OPENAI_API_KEY ausente");
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada." });
    }

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: SYSTEM_PROMPT.trim()}, ...messages]
    });

    const reply = (resp.output_text || "").trim();
    if (!reply) {
      console.error("Erro 502: Resposta vazia da OpenAI");
      return res.status(502).json({ error: "Resposta vazia da OpenAI" });
    }

    console.log("✅ OpenAI respondeu com texto (tamanho):", reply.length);
    res.json({ reply });
  } catch (e) {
    // log rico no servidor
    const status = e?.status || 500;
    console.error("❌ /api/chat falhou — status:", status);
    console.error("Mensagem:", e?.message || e);
    if (e?.stack) console.error("Stack:", e.stack);

    // devolve msg pro front ver
    res.status(status).json({ error: e?.message || "Falha ao chamar a OpenAI" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`On :${PORT}`));








