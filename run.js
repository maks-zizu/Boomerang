// Основной файл.
// Запускает игру.
const player = require('play-sound')((opts = {}));
const Game = require('./src/Game');
const runInteractiveConsole = require('./src/keyboard');

// Инициализация игры с настройками.
const game = new Game({
  trackLength: 40,
});

// Запуск игры.
game.play();
runInteractiveConsole(game);
//db_changes
runInteractiveConsole(game);
