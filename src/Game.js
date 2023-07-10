const player = require('play-sound')((opts = {}));
const readlineSync = require('readline-sync');
const Hero = require('./game-models/Hero');
const Enemy = require('./game-models/Enemy');
const Boomerang = require('./game-models/Boomerang');
const View = require('./View');

const { User } = require('../db/models');

// Основной класс игры.

class Game {
  constructor({ trackLength }) {
    this.trackLength = trackLength;
    this.boomerang = new Boomerang(trackLength);
    this.hero = new Hero({
      position: 0,
      boomerang: this.boomerang,
      newPosition: undefined,
      scores: 0,
    });
    this.enemy = new Enemy(trackLength);
    this.enemy2 = new Enemy(trackLength);
    this.view = new View(this);
    this.track = [];
    this.track2 = [];
    this.regenerateTrack();
  }

  regenerateTrack() {
    // Сборка всего необходимого (герой, враг(и), оружие)
    // в единую структуру данных

    this.track = new Array(this.trackLength).fill('_');
    this.track[this.hero.position] = this.hero.skin;

    this.track = new Array(this.trackLength).fill('_');

    this.track[this.enemy.position] = this.enemy.skin;

    if (this.hero.position >= 0) {
      this.track[this.hero.position] = this.hero.skin;
    }

    if (this.hero.boomerang.position >= 0 && this.hero.boomerang.position < this.trackLength) {
      this.track[this.hero.boomerang.position] = this.hero.boomerang.skin;
    }

    this.track2 = new Array(this.trackLength).fill('_');

    if (this.hero.newPosition >= 0) {
      this.track2[this.hero.newPosition] = this.hero.skin;
    }

    this.track2[this.enemy2.newPosition] = this.enemy2.skin;

    if (
      this.hero.boomerang.newPosition >= 0 &&
      this.hero.boomerang.newPosition < this.trackLength
    ) {
      this.track2[this.hero.boomerang.newPosition] = this.hero.boomerang.skin;
    }
  }

  play() {
    player.play('./src/Ost.mp3');
    // во время запуска игры выводится форма регистрации и присваивается имя игрока
    this.hero.name = readlineSync.question(
      '🤜🏼 ЗА ВСЁ, ЧТО МЫ ДЕЛАЕМ, ОТВЕЧАТЬ БУДЕМ ВМЕСТЕ!(@Саша Белый) 🤛🏼\nВведи своё имя: '
    );
    process.stdin.resume();
    if (!this.hero.name) {
      this.hero.name = 'Anonimus';
    }

    setInterval(() => {
      this.handleCollisions();
      this.regenerateTrack();

      //Логика движений
      this.enemy.moveLeft();
      this.enemy2.moveLeft();

      // Если враг достиг края трека, перемещаем его в начало
      if (this.enemy.position < 0) {
        this.enemy = new Enemy(this.trackLength);
      }
      if (this.enemy2.newPosition < 0) {
        this.enemy2 = new Enemy(this.trackLength);
      }

      this.view.render(this.track);
    }, 50);
  }

  // записать игрока в БД
  async dieHero() {
    const user = await User.findOrCreate({
      where: { name: this.hero.name },
      defaults: { score: this.hero.scores },
      logging: false,
    });
  }

  async handleCollisions() {
    if (
      (this.hero.position >= this.enemy.position && this.hero.position - this.enemy.position < 2) ||
      (this.hero.newPosition >= this.enemy2.newPosition &&
        this.hero.newPosition - this.enemy2.newPosition < 2)
    ) {
      this.hero.lifesCount -= 1;

      if (this.hero.lifesCount === 2) {
        this.hero.lifes = 'Жизни: 💙💙💀';
        this.enemy.position = 27;
      }
      if (this.hero.lifesCount === 1) {
        this.hero.lifes = 'Жизни: 💙💀💀';

        this.enemy.position = 25;
      }
      if (this.hero.lifesCount === 0) {
        this.hero.lifes = 'Жизни: 💀💀💀';
        await this.dieHero();
        this.hero.die();
      }
    }
    // бумеранг сталкивается с врагом
    if (this.boomerang.position >= this.enemy.position) {
      this.enemy.die();
      this.hero.scores += 1;
      // обнуляем позиции врага
      this.boomerang.position = undefined;
      this.enemy = new Enemy(this.trackLength); // Создаем нового врага
    }

    if (this.boomerang.newPosition >= this.enemy2.newPosition) {
      this.enemy2.die();
      this.hero.scores += 1;
      this.boomerang.newPosition = undefined;
      this.enemy2 = new Enemy(this.trackLength);
    }
  }
}

module.exports = Game;
