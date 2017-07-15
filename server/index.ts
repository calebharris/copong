import * as express from "express";
import * as faye from "faye";
import * as http from "http";

const app = express();
app.set("views", "./views");
app.set("view engine", "ejs");

app.use("/public/dist", express.static("../client/dist"));
app.use("/public/assets", express.static("./public/assets"));

app.get("/", (req, res) => {
  res.render("index");
});

const bayeux = new faye.NodeAdapter({mount: "/topics", timeout: 45});

const state = {
  paddle: {
    v: {
      x: 0
    },
    pos: {
      x: 0
    }
  },
  ts: process.hrtime()
};

function handleKeyDown(evt) {
  switch (evt.payload.key) {
    case "cursorRight":
      state.paddle.v.x += 1;
      break;
    case "cursorLeft":
      state.paddle.v.x -= 1;
      break;
    default:
      console.dir("Unknown keyDown event:", evt);
  }
}

function handleKeyUp(evt) {
  switch (evt.payload.key) {
    case "cursorRight":
      state.paddle.v.x -= 1;
      break;
    case "cursorLeft":
      state.paddle.v.x += 1;
      break;
    default:
      console.dir("Unknown keyUp event:", evt);
  }
}

bayeux.getClient().subscribe("/topics/game/controls", (evt) => {
  console.log("Got event: ");
  console.dir(evt);
  switch (evt.name) {
    case "keyDown":
      handleKeyDown(evt);
      break;
    case "keyUp":
      handleKeyUp(evt);
      break;
    default:
      console.dir("Unknown event:", evt);
  }
});

let sendingEvents = false;

bayeux.on("subscribe", (clientId, channel) => {
  console.info(`client ${clientId} subscribed to ${channel}`); 
  if (!sendingEvents) {
    sendingEvents = true;
    sendEventsForever();
  }
});

function sendEventsForever() {
  setInterval(() => {
    state.paddle.pos.x += (state.paddle.v.x);
    bayeux.getClient().publish("/topics/game/state", {name: "tick", state: state});
  }, 1000 / 60);
}

const port = parseInt(process.env.COPONG_PORT || "3000");

const server = http.createServer(app);
bayeux.attach(server);
server.listen(port, () => {
  console.log(`Server running ${port}`);
});
