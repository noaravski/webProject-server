import initApp from "./server";
import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT;
const domain = process.env.DOMAIN_BASE;
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

if (!sslKeyPath || !sslCertPath) {
  throw new Error("SSL key or certificate path is not defined in the environment variables.");
}

const sslOptions = {
  key: fs.readFileSync(sslKeyPath),
  cert: fs.readFileSync(sslCertPath),
};

initApp()
  .then((app) => {
    https.createServer(sslOptions, app).listen(port, () => {
      console.log(`Project running securely at ${domain}:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
