"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("phaser-ce/build/custom/pixi");
const p2 = require("phaser-ce/build/custom/p2");
const Phaser = require("phaser-ce/build/custom/phaser-split");
window.PIXI = PIXI;
window.p2 = p2;
let game = new Phaser.Game(640, 480, Phaser.AUTO, null, { preload: preload, create: create, update: update });
let ballSprite;
function preload() {
    game.load.spritesheet('ball', 'public/assets/aqua_ball.png', 17, 17);
    game.load.spritesheet('paddle', 'public/assets/phaser.png', 144, 31);
}
function create() {
    ballSprite = game.add.sprite(0, 0, 'ball');
}
function update() {
    ballSprite.position.x = ballSprite.position.x + 10;
    console.log(`New x: ${ballSprite.x}`);
}
console.log("Hello World!");
