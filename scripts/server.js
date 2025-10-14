const express = require("express");
const path = require("path");

// change the port if necessary
const PORT = process.env.PORT ? Number(process.env.PORT) : 0; // 0 表示由系统分配可用端口

const dir = path.join(__dirname, "../src");
const app = express();
app.use(express.static(dir));

const server = app.listen(PORT, () => {
  const actualPort = server.address().port;
  const URL = `http://localhost:${actualPort}/index.html`;
  console.info(`\n---------------------------------------\n`);
  console.info(`please visit: ${URL}`);
  console.info(`\n---------------------------------------\n`);
});
