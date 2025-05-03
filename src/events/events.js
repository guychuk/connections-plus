import {
  submitToast,
  showErrorScreen,
  win,
  getTextForDifficultyButton,
  spin,
  setLayout,
  drawBoard,
  getLayout,
  shuffleBoard,
  disableButtons,
  enableButtons,
  clearBanners,
} from "../components/ui";
import { resetGame, completeGroup, solveNextGroup } from "../core/gameLogic";
import { delay, makePositions } from "../core/utils";

/* ------------------------
      GAME CONTROLS
  ------------------------ */

/**
 * Handles the submit button being clicked.
 * @param {Object} gameState The game state object.
 * @param {Array} groups The array of group sizes in the game, sorted.
 * @param {Array} positions The array of positions on the board, where each position is an object with x and y properties.
 * @param {Object} boardConfig The board configuration object.
 * @param {Object} gameControlButtons The game control buttons object.
 */
export const clickSubmit = (
  gameState,
  groups,
  positions,
  boardConfig,
  gameControlButtons
) => {
  const { toast, newlyCompletedGroup } = submitToast(gameState, groups);

  // Should never happen
  if (toast === null) {
    console.error("Toast is null");
    showErrorScreen;
    return;
  }

  toast.showToast();

  // Update completed groups
  if (newlyCompletedGroup !== null) {
    const groupIndex = newlyCompletedGroup[0].groupIndex;

    completeGroup(groupIndex, gameState, positions, groups);

    drawBoard(positions, gameState, boardConfig);
  }

  // When pressing the button fast enough, the toasts get stuck.
  const submitButton = gameControlButtons.submit;
  submitButton.disabled = true;

  if (gameState.unsolvedTiles.size > 0) {
    setTimeout(() => {
      submitButton.disabled = gameState.gameOver;
    }, toast.options.duration + 100);
  } else {
    gameState.gameWon = true;
    gameState.gameOver = true;

    win(gameControlButtons);
  }
};

/**
 * Event handler for the difficulty button.
 * @param {MouseEvent} event The event when the user clicks the difficulty button.
 */
export const clickDifficulty = (event) => {
  const button = event.currentTarget;

  switch (button.dataset.difficulty) {
    case "easy":
      button.dataset.difficulty = "medium";
      break;
    case "medium":
      button.dataset.difficulty = "hard";
      break;
    case "hard":
      button.dataset.difficulty = "easy";
      break;
  }

  button.textContent = getTextForDifficultyButton(button.dataset.difficulty);
};

/**
 * Event handler for the new game button.
 * @param {Object} gameControlButtons The game control buttons object.
 * @param {Object} gameState The game state object.
 * @param {SupabaseClient} supabaseClient The Supabase client.
 * @param {Array} groups The array of group sizes.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Object} boardConfig The board configuration object.
 */
export const clickNewGame = async (
  gameControlButtons,
  gameState,
  supabaseClient,
  groups,
  positions,
  boardConfig
) => {
  const gameControlButtonsArray = Object.values(gameControlButtons);

  // Disable the buttons until the game is reset
  disableButtons(gameControlButtonsArray);

  clearBanners(gameState.solvedGroups);

  const difficultyButton = gameControlButtons.difficulty;

  await resetGame(
    supabaseClient,
    difficultyButton.dataset.difficulty,
    groups,
    gameState,
    positions
  );

  clickShuffle(positions, gameState, boardConfig);

  // Enable the buttons
  enableButtons(gameControlButtonsArray);
};

/**
 * Shuffles the remaining tiles and redraws the board.
 * @param {Array} positions An array of positions to shuffle.
 * @param {Object} gameState The game state object.
 * @param {Object} boardConfig The board configuration object.
 */
export const clickShuffle = (positions, gameState, boardConfig) => {
  shuffleBoard(gameState.unsolvedTiles, positions, getLayout());

  drawBoard(positions, gameState, boardConfig);
};

/**
 * Deselects all currently selected tiles.
 * Removes the "selected" CSS class from each tile's button and clears the set of selected tiles.
 * @param {Set} activeTiles The set of currently selected tiles.
 */
export const clickDeselect = (activeTiles) => {
  for (const tile of activeTiles) {
    tile.button.classList.remove("selected");
  }

  activeTiles.clear();
};

/**
 * Solves the game by repeatedly calling solveNextGroup until all tiles are
 * cleared, and then enables the new game button.
 * @param {Object} gameState The game state object.
 * @param {Array} groups The array of group sizes.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Object} boardConfig The board configuration object.
 * @param {Object} gameControlButtons The game control buttons object.
 */
export const clickSolve = async (
  gameState,
  groups,
  positions,
  boardConfig,
  gameControlButtons
) => {
  const gameControlButtonsArray = Object.values(gameControlButtons);

  disableButtons(gameControlButtonsArray);

  const iteration = async () => {
    solveNextGroup(groups, gameState, positions);

    drawBoard(positions, gameState, boardConfig);

    await delay(750);
  };

  while (gameState.unsolvedTiles.size > 0) {
    await iteration();
  }

  gameState.gameWon = false;
  gameState.gameOver = true;

  enableButtons([gameControlButtons.newGame]);
};

/* ------------------------
          SETTINGS
  ------------------------ */

/**
 * Event handler for the settings button.
 * Toggles the blur effect and visibility of the settings panel.
 * @param {MouseEvent} event The event when the user clicks the settings button.
 */
export const clickSettings = (event) => {
  spin(event);

  const settingsPanel = document.getElementById("settings-panel");
  const selectLayout = document.getElementById("select-layout");
  const blurOverlay = document.getElementById("blur-overlay");

  blurOverlay.classList.toggle("blurred");
  settingsPanel.classList.toggle("blurred");

  selectLayout.value = getLayout();
};

/**
 * Applies the selected layout and shuffles the board if the layout changed.
 * @param {HTMLElement} settingsPanel The settings panel element.
 * @param {HTMLElement} blurOverlay The blur overlay element.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object.
 * @param {Object} boardConfig The board configuration object.
 */
export const clickApply = (
  settingsPanel,
  blurOverlay,
  positions,
  gameState,
  boardConfig
) => {
  const selectLayout = document.getElementById("select-layout");
  const layout = selectLayout.value;
  const oldLayout = getLayout();
  const rows = boardConfig.rows;
  const cols = boardConfig.cols;

  if (layout !== oldLayout) {
    setLayout(layout);

    const numOfsolvedGroups = gameState.solvedGroups.reduce(
      (acc, group) => (group.tiles.length > 0 ? acc + 1 : acc),
      0
    );

    // Update free positions
    positions.length = 0;
    positions.push(...makePositions(rows - numOfsolvedGroups, cols));

    clickShuffle(positions, gameState, boardConfig);
  }

  // Close settings panel
  blurOverlay.classList.remove("blurred");
  settingsPanel.classList.remove("blurred");
};

/* ------------------------
        ERROR PAGE
  ------------------------ */

/**
 * Event handler for the error button.
 * Spins the button and reloads the page after the spin animation finishes.
 * @param {MouseEvent} event The event when the user clicks the error button.
 */
export const clickError = (event) => {
  const rootStyles = getComputedStyle(document.documentElement);
  const spinDuration = rootStyles
    .getPropertyValue("--animation-speed-spin")
    .trim();

  spin(event);

  setTimeout(() => {
    location.reload();
  }, parseFloat(spinDuration) * 1000);
};
