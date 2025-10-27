const express = require("express");
const path = require("path");

// change the port if necessary
const PORT = process.env.PORT ? Number(process.env.PORT) : 0; // 0 表示由系统分配可用端口

const dir = path.join(__dirname, "../src");
const app = express();
app.use(express.static(dir));

// expose a small, safe config endpoint for client-side usage
// WARNING: Do NOT expose your RESTful API Key and Secret in production environment.
app.get("/config", (req, res) => {
  res.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    PROXY_PORT: process.env.PROXY_PORT || null,
    AGORA_REST_KEY: process.env.AGORA_REST_KEY || null,
    AGORA_REST_SECRET: process.env.AGORA_REST_SECRET || null,
    LLM_AWS_BEDROCK_KEY: process.env.LLM_AWS_BEDROCK_KEY || null,
    LLM_AWS_BEDROCK_ACCESS_KEY: process.env.LLM_AWS_BEDROCK_ACCESS_KEY || null,
    LLM_AWS_BEDROCK_SECRET_KEY: process.env.LLM_AWS_BEDROCK_SECRET_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null,
  });
});

const server = app.listen(PORT, () => {
  const actualPort = server.address().port;
  const URL = `http://localhost:${actualPort}/index.html`;
  console.info(`\n---------------------------------------\n`);
  console.info(`please visit: ${URL}` );
  console.info(`\n---------------------------------------\n`);
});
