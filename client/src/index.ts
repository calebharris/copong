import * as Faye from "faye";
import {autoDetectRenderer, loader, Container, Sprite} from "pixi.js";
const Rx = require("rxjs/Rx");

const client = new Faye.Client("/topics");

const GAME_W = 640, GAME_H = 480;
const BALL_FILE = "public/assets/aqua_ball.png";
const PADDLE_FILE = "public/assets/phaser.png";

const renderer = autoDetectRenderer(GAME_W, GAME_H);
document.body.appendChild(renderer.view);
const stage = new Container();

loader.add([BALL_FILE, PADDLE_FILE]).load(create);

let ballSprite: Sprite;
let paddleSprite: Sprite;

function create() {
  ballSprite = new Sprite(loader.resources[BALL_FILE].texture);
  paddleSprite = new Sprite(loader.resources[PADDLE_FILE].texture);
  paddleSprite.x = 0;
  paddleSprite.y = GAME_H - 31;
  stage.addChild(ballSprite);
  stage.addChild(paddleSprite);

  Rx.Observable
    .fromEventPattern(
      _ => window.addEventListener("keydown", _))
    .merge(Rx.Observable.fromEventPattern(
      _ => window.addEventListener("keyup", _)))
    .filter(
      _ => ["ArrowLeft", "ArrowRight", "Left", "Right"].some( s => s === _.key ) )
    .distinctUntilChanged(
      (l, r) => l.key === r.key && l.type === r.type )
    .map(
      _ => ({
        name: _.type === "keyup" ? "keyUp" : "keyDown",
        payload: {
          key: _.key === "ArrowLeft" || _.key === "Left" ? "cursorLeft" : "cursorRight"
        }
      }))
    .subscribe( _ => client.publish("/topics/game/controls", _) );

  Rx.Observable
    .fromEventPattern( _ => client.subscribe("/topics/game/state", _))
    .subscribe( _ => {
      paddleSprite.x = _.state.paddle.pos.x;
      ballSprite.x = _.state.ball.pos.x;
      ballSprite.y = _.state.ball.pos.y;
    });
}

function update(timestamp: number) {
  renderer.render(stage);
  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);
