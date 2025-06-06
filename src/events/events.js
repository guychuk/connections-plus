import * as UI from "../components/ui";
import {
  resetGame,
  completeGroup,
  solveNextGroup,
  submitToast,
} from "../core/gameLogic";
import { delay, makePositions } from "../core/utils";

/* --- Game Controls --- */

/**
 * Handles the submit button being clicked.
 * @param {Object} gameState The game state object.
 * @param {Array} groups The array of group sizes in the game, sorted.
 * @param {Array} positions The array of positions on the board, where each position is an object with x and y properties.
 * @param {Object} boardConfig The board configuration object.
 * @param {Object} gameControlButtons The game control buttons object.
 */
const clickSubmit = (
  gameState,
  groups,
  positions,
  boardConfig,
  gameControlButtons
) => {
  const { toast, newlyCompletedGroup } = submitToast(
    gameState,
    groups,
    positions,
    boardConfig,
    gameControlButtons
  );

  if (gameState.mistakesMade === gameState.mistakesAllowed) {
    return;
  }

  if (toast === null) {
    // Should never happen
    console.error("Toast is null");
    UI.showErrorScreen();
    return;
  }

  toast.showToast();

  // Update completed groups
  if (newlyCompletedGroup !== null) {
    const groupIndex = newlyCompletedGroup[0].groupIndex;

    completeGroup(groupIndex, gameState, positions, groups);

    UI.drawBoard(positions, gameState, boardConfig);
    UI.updateSubtitle(groups, gameState.solvedGroups);
  }

  // When pressing the button fast enough, the toasts get stuck.
  const submitButton = gameControlButtons.submit;
  submitButton.disabled = true;

  if (gameState.unsolvedTiles.size) {
    setTimeout(() => {
      submitButton.disabled = gameState.gameOver;
    }, toast.options.duration + 100);
  } else {
    gameState.gameWon = true;
    gameState.gameOver = true;

    UI.win(gameControlButtons);
  }
};

/**
 * Event handler for the difficulty button.
 * @param {MouseEvent} event The event when the user clicks the difficulty button.
 */
const clickDifficulty = (event) => {
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

  button.textContent = UI.getTextForDifficultyButton(button.dataset.difficulty);
};

/**
 * Event handler for the new game button.
 * @param {Object} gameControlButtons The game control buttons object.
 * @param {Object} gameState The game state object.
 * @param {Array} groups The array of group sizes.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Object} boardConfig The board configuration object.
 */
const clickNewGame = async (
  gameControlButtons,
  gameState,
  groups,
  positions,
  boardConfig
) => {
  const gameControlButtonsArray = Object.values(gameControlButtons);

  // Disable the buttons until the game is reset
  UI.disableButtons(gameControlButtonsArray);

  UI.clearBanners(gameState.solvedGroups);

  const difficultyButton = gameControlButtons.difficulty;

  await resetGame(
    difficultyButton.dataset.difficulty,
    groups,
    gameState,
    positions
  );

  clickShuffle(positions, gameState, boardConfig);

  // Enable the buttons
  UI.enableButtons(gameControlButtonsArray);
};

/**
 * Shuffles the remaining tiles and redraws the board.
 * @param {Array} positions An array of positions to shuffle.
 * @param {Object} gameState The game state object.
 * @param {Object} boardConfig The board configuration object.
 */
const clickShuffle = (positions, gameState, boardConfig) => {
  UI.shuffleBoard(gameState.unsolvedTiles, positions, UI.getLayout());

  UI.drawBoard(positions, gameState, boardConfig);
};

/**
 * Deselects all currently selected tiles.
 * Removes the "selected" CSS class from each tile's button and clears the set of selected tiles.
 * @param {Set} activeTiles The set of currently selected tiles.
 */
export const clickDeselect = (activeTiles) => {
  for (const tile of activeTiles) {
    if (tile.button.classList.contains("hinted")) continue;
    tile.button.classList.remove("selected");
    activeTiles.delete(tile);
  }
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

  UI.disableButtons(gameControlButtonsArray);

  const iteration = async () => {
    solveNextGroup(groups, gameState, positions);

    UI.drawBoard(positions, gameState, boardConfig);

    await delay(750);
  };

  while (gameState.unsolvedTiles.size > 0) {
    await iteration();
  }

  gameState.gameWon = false;
  gameState.gameOver = true;

  UI.enableButtons([gameControlButtons.newGame]);
};

export const clickHint = (gameState, groups) => {
  const solvedGroups = gameState.solvedGroups;
  const activeTiles = gameState.activeTiles;
  const unsolvedTiles = gameState.unsolvedTiles;

  let hintGroup;
  let hintGroupSize;
  let cardsToShow;

  // Find the biggest group to not have been completed
  for (let i = groups.length - 1; i >= 0; i--) {
    if (solvedGroups[i].tiles.length === 0) {
      hintGroup = i;
      hintGroupSize = groups[i];
      cardsToShow = Math.ceil(hintGroupSize / 2);
      break;
    }
  }

  // Deselect all cards
  clickDeselect(activeTiles);

  // Select cards as a hint
  for (const tile of unsolvedTiles) {
    if (tile.groupIndex === hintGroup) {
      tile.button.click();
      tile.button.classList.add("hinted");

      if (activeTiles.size === cardsToShow) {
        break;
      }
    }
  }
};

export function initializeGameControls(
  gameState,
  boardConfig,
  positions,
  groups
) {
  const controlButtons = {
    newGame: document.getElementById("newGame-button"),
    deselect: document.getElementById("clear-button"),
    shuffle: document.getElementById("shuffle-button"),
    hint: document.getElementById("hint-button"),
    solve: document.getElementById("solve-button"),
    submit: document.getElementById("submit-button"),
    difficulty: document.getElementById("difficulty-button"),
  };

  // Difficulty Button
  controlButtons.difficulty.addEventListener("click", (event) => {
    clickDifficulty(event);
    controlButtons.newGame.click();
  });

  // Shuffle Button
  controlButtons.shuffle.addEventListener("click", () => {
    clickShuffle(positions, gameState, boardConfig);
  });

  // New Game Button
  controlButtons.newGame.addEventListener("click", async () => {
    clickNewGame(controlButtons, gameState, groups, positions, boardConfig);
  });

  // Deselect Button
  controlButtons.deselect.addEventListener("click", () => {
    clickDeselect(gameState.activeTiles);
  });

  // Submit Button
  controlButtons.submit.addEventListener("click", () => {
    clickSubmit(gameState, groups, positions, boardConfig, controlButtons);
  });

  // Solve Button
  controlButtons.solve.addEventListener("click", async () => {
    await clickSolve(gameState, groups, positions, boardConfig, controlButtons);
  });

  // Hint Button
  controlButtons.hint.addEventListener("click", () => {
    clickHint(gameState, groups);
  });
}

/* --- Settings --- */

/**
 * Toggles the settings panel, and closes the how-to popup if open.
 * @param {MouseEvent} event The event when the user clicks the settings button.
 */
export const clickSettings = (event) => {
  UI.spin(event);

  const selectLayout = document.getElementById("select-layout");

  if (UI.howToPopupIsOpen()) {
    UI.toggleHowToPopup();
  } else {
    UI.toggleBlurOverlay();
  }

  UI.toggleSettingsPanel();

  selectLayout.value = UI.getLayout();
};

/**
 * Applies the selected layout and shuffles the board if the layout changed.
 * @param {HTMLElement} settingsPanel The settings panel element.
 * @param {HTMLElement} blurOverlay The blur overlay element.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object.
 * @param {Object} boardConfig The board configuration object.
 */
const clickApply = (positions, gameState, boardConfig) => {
  const selectLayout = document.getElementById("select-layout");
  const layout = selectLayout.value;
  const oldLayout = UI.getLayout();
  const rows = boardConfig.rows;
  const cols = boardConfig.cols;

  if (layout !== oldLayout) {
    UI.setLayout(layout);

    const numOfsolvedGroups = gameState.solvedGroups.reduce(
      (acc, group) => (group.tiles.length > 0 ? acc + 1 : acc),
      0
    );

    // Update free positions
    positions.length = 0;
    positions.push(...makePositions(rows - numOfsolvedGroups, cols));

    clickShuffle(positions, gameState, boardConfig);
  }

  UI.toggleSettingsPanel();
  UI.toggleBlurOverlay();
};

export function initializeSettings(positions, gameState, boardConfig) {
  const applyButton = document.getElementById("apply-button");

  applyButton.addEventListener("click", () => {
    clickApply(positions, gameState, boardConfig);
  });
}

/* --- How To --- */

/**
 * Toggles the how-to popup, and close the settings panel if open.
 */
export const clickHowTo = () => {
  if (UI.settingsPanelIsOpen()) {
    UI.toggleSettingsPanel();
  } else {
    UI.toggleBlurOverlay();
  }

  UI.toggleHowToPopup();
};

/* --- Big Screens --- */

/**
 * Event handler for the error button.
 * Spins the button and reloads the page after the spin animation finishes.
 * @param {MouseEvent} event The event when the user clicks the error button.
 */
export const clickScreenButton = (event) => {
  const rootStyles = getComputedStyle(document.documentElement);
  const spinDuration = rootStyles
    .getPropertyValue("--animation-speed-spin")
    .trim();

  UI.spin(event);

  setTimeout(() => {
    location.reload();
  }, parseFloat(spinDuration) * 1000);
};

/* --- Language --- */

/**
 * Changes the language to the next one in the list of languages, and
 * restarts the game.
 */
export const clickLanguageButton = () => {
  const nextLanguage = UI.getNextLanguage();
  UI.setLanguage(nextLanguage);

  const newGameButton = document.getElementById("newGame-button");
  newGameButton.click();

  UI.updateTexts();
};
