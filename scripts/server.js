const express = require("express");
const path = require("path");

// change the port if necessary
const PORT = process.env.PORT ? Number(process.env.PORT) : 0; // 0 表示由系统分配可用端口

const dir = path.join(__dirname, "../src");
const app = express();
app.use(express.static(dir));

// parse JSON bodies from the browser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(dir));

// expose a small, safe config endpoint for client-side usage
// WARNING: Do NOT expose your RESTful API Key and Secret in production environment.
app.get("/config", (req, res) => {
  res.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    LLM_AWS_BEDROCK_KEY: process.env.LLM_AWS_BEDROCK_KEY || null,
    LLM_AWS_BEDROCK_ACCESS_KEY: process.env.LLM_AWS_BEDROCK_ACCESS_KEY || null,
    LLM_AWS_BEDROCK_SECRET_KEY: process.env.LLM_AWS_BEDROCK_SECRET_KEY || null,
    OPENAI_KEY: process.env.OPENAI_KEY || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null
  });
});

// Proxy: start Convo AI (server calls Agora so browser doesn't need credentials)
app.post("/api/convo-ai/start", async (req, res) => {
  try {
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    if (!appid || !apiKey || !apiSecret) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing Agora credentials" });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    console.log("Convo API URL ->", url);
    console.log("Convo API body ->", JSON.stringify(req.body, null, 4));


    const data = await response.text();
    const status = response.status;

    console.log("Convo API response ->", JSON.stringify(data, null, 4));

    try {
      // return parsed JSON if possible
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (err) {
    console.error("Proxy /api/convo-ai/start error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Proxy: stop (leave) Convo AI agent
app.post("/api/convo-ai/agents/:agentId/leave", async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    if (!appid || !apiKey || !apiSecret) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing Agora credentials" });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.text();
    const status = response.status;
    try {
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (err) {
    console.error("Proxy /api/convo-ai/leave error:", err);
    res.status(500).json({ error: String(err) });
  }
});

const server = app.listen(PORT, () => {
  const actualPort = server.address().port;
  const URL = `http://localhost:${actualPort}/example/basic/basicVideoCall/index.html`;
  console.info(`\n---------------------------------------\n`);
  console.info(`please visit: ${URL}`);
  console.info(`\n---------------------------------------\n`);
});
