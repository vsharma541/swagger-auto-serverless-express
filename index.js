const express = require("express");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerJSDocs = YAML.load("./api.yaml");
const axios = require("axios");
const serverless = require('serverless-http');

module.exports.handler = async (event, context) => {
  console.log(event);
  
  const app = express();
  app.use(express.json());
  console.log(JSON.stringify(swaggerJSDocs))
  modifyKeys(swaggerJSDocs, event.requestContext.stage);
  console.log('after modification: ');
  console.log(JSON.stringify(swaggerJSDocs))
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));
  
  var users = [
    { id: 1, name: "Tom, Cruise" },
    { id: 2, name: "John Cena" },
  ];
  
  app.get("/string", (req, res) => {
    console.log(req.headers);
    res.status(200).send("Users Route");
  });
  
  app.get("/user", async (req, res) => {
    // res.status(200).send({ id: 1, name: "Tom, Cruise" });
    const resp = await axios({
      method: 'get',
      url: "https://petstore.swagger.io/v2/pet/findByStatus?status=available",
  });
  console.log(resp.data[0]);
    const userObj = {
      id: resp.data[0].id,
      name: resp.data[0].name
    }
    res.status(200).send(userObj);
  });
  
  app.get("/users", (req, res) => {
    res.status(200).send(users);
  });
  
  app.get("/users/:id", (req, res) => {
    res.status(200).send(users.find((x) => x.id === parseInt(req.params.id)));
  });
  
  app.post("/create", (req, res) => {
    users = [req.body, ...users];
    res.send(users);
  });
  
  app.get("/usersQuery", (req, res) => {
    res.send(users.find((x) => x.id === parseInt(req.query.id)));
  });
  
  const handler = serverless(app);
  const ret = await handler(event, context);
  return ret;
  // if(process.env.ENVIRONMENT) {
  // }else {
  //   app.listen(4000, () => console.log("Up & RUnning"));
  // }
}

function modifyKeys(swaggerDoc, stage) {
  var keys = Object.keys(swaggerDoc.paths);
  for(let i=0; i<keys.length; i++) {
    let newKey = `/${stage}/${keys[i].split('/')[1]}`;
    swaggerDoc.paths[newKey] = swaggerDoc.paths[keys[i]];
    delete swaggerDoc.paths[keys[i]];
  }
}