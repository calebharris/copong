import * as Phaser from "phaser-ce";
import * as Faye from "faye";
const Rx = require("rxjs/Rx");

const client = new Faye.Client("/topics");

const GAME_W = 640, GAME_H = 480;

let game = new Phaser.Game(GAME_W, GAME_H, Phaser.AUTO, null, {preload: preload, create: create, update: update});

let ballSprite: Phaser.Sprite;
let paddleSprite: Phaser.Sprite;

function preload() {
  game.load.spritesheet('ball', 'public/assets/aqua_ball.png', 17, 17);
  game.load.spritesheet('paddle', 'public/assets/phaser.png', 144, 31);
}

function create() {
  ballSprite = game.add.sprite(0, 0, 'ball');
  paddleSprite = game.add.sprite(0, GAME_H - 31, "paddle");

  Rx.Observable
    .fromEventPattern(
      _ => game.input.keyboard.onDownCallback = _ )
    .merge(Rx.Observable.fromEventPattern(
      _ => game.input.keyboard.onUpCallback = _ ))
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
}

function update() {
}

const sub = client.subscribe("/topics/game/state", _ => {
  paddleSprite.position.x = _.state.paddle.pos.x;
  ballSprite.position.x = _.state.ball.pos.x;
  ballSprite.position.y = _.state.ball.pos.y;
});
sub.then( () => console.log("Subscription confirmed") );
