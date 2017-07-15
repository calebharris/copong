import * as Phaser from "phaser-ce";
import * as faye from "faye";

const client = new faye.Client("/topics");

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
  const cursorKeys = game.input.keyboard.createCursorKeys();
  cursorKeys.right.onDown.add(() => {
    console.log("right pressed");
    client.publish("/topics/game/controls", { 
      name: "keyDown",
      payload: {
        key: "cursorRight"
      }
    });
  });
  cursorKeys.right.onUp.add(() => {
    console.log("right released");
    client.publish("/topics/game/controls", {
      name: "keyUp",
      payload: {
        key: "cursorRight"
      }
    });
  });
  cursorKeys.left.onDown.add(() => {
    console.log("left pressed");
    client.publish("/topics/game/controls", { 
      name: "keyDown",
      payload: {
        key: "cursorLeft"
      }
    });
  });
  cursorKeys.left.onUp.add(() => {
    console.log("left released");
    client.publish("/topics/game/controls", {
      name: "keyUp",
      payload: {
        key: "cursorLeft"
      }
    });
  });
}

function update() {
}

const sub = client.subscribe("/topics/game/state", (evt) => {
  //console.log(evt);
  paddleSprite.position.x = evt.state.paddle.pos.x;
});
sub.then(() => {
  console.log("Subscription confirmed");
});




