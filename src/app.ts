import fs from "fs";
import initApp from "./server";
import http from "http"
import https from "https"

const port = process.env.PORT;
const domain = process.env.DOMAIN_BASE;

initApp()
  .then((app) => {
    const options = {
      key: fs.readFileSync("../client-key.pem"),
      cert: fs.readFileSync("../client-cert.pem")
    }
    https.createServer(options, app).listen(port)

    // app.listen(port, () => {
    //   console.log(`Project running at ${domain}:${port}`);
    // });
  })
  .catch((error) => {
    console.error(error);
  });
