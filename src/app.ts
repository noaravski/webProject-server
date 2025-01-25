import initApp from "./server";
const port = process.env.PORT;

initApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`Project running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
