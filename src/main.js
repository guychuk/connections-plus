import { drawBoard, initializeGameUI } from "./components/ui";
import { initializeGame } from "./core/gameLogic";
import { initializeGameControls, initializeSettings } from "./events/events";
import config from "./config/config.json";

(async () => {
  // Initialize UI
  const { groups, board, gaps } = initializeGameUI(config);

  // Initialize the game

  const defaultDifficulty = config["defaultDifficulty"];

  const { gameState, positions, boardConfig } = await initializeGame(
    config,
    defaultDifficulty,
    groups,
    board,
    gaps
  );

  drawBoard(positions, gameState, boardConfig);

  // Add events

  initializeGameControls(gameState, boardConfig, positions, groups);

  initializeSettings(positions, gameState, boardConfig);
})();
