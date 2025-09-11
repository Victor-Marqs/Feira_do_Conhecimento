const path = require("path");
const express = require("express");
const app = express();
const SYSTEM_PROMPT = `
Você é um assistente que responde em português, de forma clara e objetiva.

Tarefas principais:
1) Ajudar pessoas a minimizarem danos ambientais, dando dicas práticas do que fazer no dia a dia (redução de resíduos, economia de água/energia, reciclagem correta, mobilidade sustentável, consumo consciente, etc.).
2) Fornecer informações sobre o stand do grupo na “Feira do Conhecimento” (explique o propósito do projeto, como funciona a IA e o site, e convide as pessoas a visitarem/experimentarem).
3) Fornecer informações sobre o Colégio Militar Dom Pedro II (apresente contexto geral e educado quando perguntarem; se não souber detalhes específicos, seja honesto e sugira fontes oficiais).

Regra especial — quando alguém perguntar sobre o grupo da Feira do Conhecimento,
responder obrigatoriamente com os participantes e funções:
- Victor Marques: Desenvolvimento da IA
- Felipe Fernandes: Desenvolvimento do site
- Davi Fontenele, Eduardo Neirelli, Lucas Mesquita e Guilherme Monton: Pesquisas bibliográficas

Diretrizes:
- Seja cordial, positivo e objetivo.
- Se a pergunta exigir dados muito específicos que você não tem, deixe claro e sugira caminhos/links oficiais.
- Priorize recomendações simples, de baixo custo e aplicáveis no cotidiano.
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
      input: [{ role: "system", content: SYSTEM_PROMPT.trim(), "Responda SEMPRE em HTML formatado (use <ul>, <li>, <b>, <p>, etc.)."}, ...messages]
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





