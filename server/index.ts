import * as express from "express";
import * as faye from "faye";
import * as http from "http";
import * as Rx from "rxjs";

const WORLD_WIDTH = 640;
const WORLD_HEIGHT = 480;

const PADDLE_WIDTH = 144;
const PADDLE_HEIGHT = 31;

const BALL_WIDTH = 17;
const BALL_HEIGHT = 17;

const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");

app.use("/public/dist", express.static("../client/dist"));
app.use("/public/assets", express.static("./public/assets"));

app.get("/", (req, res) => {
  res.render("index");
});

const bayeux = new faye.NodeAdapter({mount: "/topics", timeout: 45});

const initialState = () => {
  return ({
    paddle: {
      v:   { x: 0 },
      pos: { x: (WORLD_WIDTH - PADDLE_WIDTH) / 2 }
    },
    ball: {
      v:   { x: 2, y: 2 },
      pos: { x: 0, y: (WORLD_HEIGHT - BALL_HEIGHT) / 2 }
    }
  });
};

let state = initialState();

const [downObs, upObs] = Rx.Observable
  .fromEventPattern( _ => bayeux.getClient().subscribe("/topics/game/controls", _) )
  .partition( (_: any) => _.name === "keyDown" );

const [leftObs, rightObs] = downObs
  .map( _ => Object.assign({}, _, { vMult: 1 }) )
  .merge(upObs.map( _ => Object.assign({}, _, { vMult: -1 }) ))
  .partition( _ => _.payload.key === "cursorLeft" );

leftObs
  .map( _ => Object.assign({}, _, { deltaVX: -1 }) )
  .merge(rightObs.map( _ => Object.assign({}, _, { deltaVX: 1 }) ))
  .subscribe( _ => {
    console.log("Got event: ");
    console.dir(_);
    state.paddle.v.x += ( _.vMult * _.deltaVX )
  });
  
bayeux.on("subscribe", (clientId, channel) => {
  console.info(`client ${clientId} subscribed to ${channel}`); 
});

function applyPaddleV(state) {
  state.paddle.pos.x += state.paddle.v.x;
  return state;
}

function applyBallV(state) {
  const v = state.ball.v;
  const pos = state.ball.pos;
  pos.x += v.x;
  pos.y += v.y;
  if (v.x > 0 && pos.x >= WORLD_WIDTH - BALL_WIDTH) { v.x = -2 }
  if (v.x < 0 && pos.x <= 0) { v.x = 2 }
  if (v.y > 0 && pos.y >= WORLD_HEIGHT - PADDLE_HEIGHT - BALL_HEIGHT) {
    // Uh-oh, we're near the bottom of the screen... did we hit the paddle?
    if (pos.x >= state.paddle.pos.x && pos.x + BALL_WIDTH <= state.paddle.pos.x + PADDLE_WIDTH) {
      v.y = -2;
    }
    // If not, reset the game
    else {
      state = initialState();
    }
  }
  if (v.y < 0 && pos.y <= 0) { v.y = 2 }
  return state;
}

const STEP_INTVL = 1000 / 60;

Rx.Observable
  .interval(STEP_INTVL)
  .mapTo(state)
  .map( _ => {
    return applyBallV(applyPaddleV(_));
  })
  .map( _ => ({ name: "tick", state: _ }) )
  .subscribe( _ => bayeux.getClient().publish("/topics/game/state", _) );

const port = parseInt(process.env.COPONG_PORT || "3000");

const server = http.createServer(app);
bayeux.attach(server);
server.listen(port, () => {
  console.log(`Server running ${port}`);
});
