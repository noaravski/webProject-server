import initApp from "./server";
import https from "https";
import http from "http";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT;
const domain = process.env.DOMAIN_BASE;

try {
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;

  if (!sslKeyPath || !sslCertPath || !fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    throw new Error(
      "SSL key or certificate path does not exist - implementing HTTP server"
    );
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
} catch (error) {
  initApp()
    .then((app) => {
      http.createServer(app).listen(port, () => {
        console.log(`Project running at ${domain}:${port}`);
      });
    })
    .catch((error) => {
      console.error(error);
    });
}
