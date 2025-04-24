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
 * @param {Event} event The event being handled.
 * @param {HTMLElement} board The board element.
 * @param {Set<Tile>} remainngTiles The set of remaining tiles.
 * @param {Set<Tile>} selectedTiles The set of currently selected tiles.
 * @param {Set<number>} previousSubmissions A set of previously submitted tile sets, represented by a number that is the hash of the set.
 * @param {Array<Group>} completedGroups An array of completed groups, with the last group being the most recently submitted one.
 * @param {Array<number>} groups The array of group sizes in the game, sorted.
 * @param {Array<Position>} positions The array of positions on the board, where each position is an object with x and y properties.
 * @param {number} tileSize The size of each tile, in pixels.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {HTMLButtonElement} shuffleButton The shuffle button element.
 * @param {HTMLButtonElement} deselectButton The deselect button element.
 * @param {HTMLButtonElement} difficultyButton The difficulty button element.
 */
export const clickSubmit = (
  event,
  board,
  remainngTiles,
  selectedTiles,
  previousSubmissions,
  completedGroups,
  groups,
  positions,
  tileSize,
  gaps,
  shuffleButton,
  deselectButton,
  difficultyButton
) => {
  const submitButton = event.currentTarget;

  const { toast, newlyCompletedGroup } = submitToast(
    selectedTiles,
    previousSubmissions,
    groups
  );

  // Should never happen
  if (toast === null) {
    console.error("Toast is null");
    showErrorScreen;
    return;
  }

  toast.showToast();

  // Update completed groups
  if (newlyCompletedGroup !== null) {
    completeGroup(
      newlyCompletedGroup[0].groupIndex,
      completedGroups,
      selectedTiles,
      remainngTiles,
      positions,
      groups
    );

    const rows = groups.length;
    const cols = groups[groups.length - 1];

    drawBoard(
      board,
      positions,
      remainngTiles,
      completedGroups,
      tileSize,
      gaps,
      rows,
      cols
    );
  }

  // When pressing the button fast enough, the toasts get stuck.
  submitButton.disabled = true;

  if (remainngTiles.size > 0) {
    setTimeout(() => {
      submitButton.disabled = false;
    }, toast.options.duration + 100);
  } else {
    win([shuffleButton, submitButton, deselectButton, difficultyButton]);
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
 * @param {HTMLElement} shuffleButton The shuffle button.
 * @param {HTMLElement} submitButton The submit button.
 * @param {HTMLElement} deselectButton The deselect all button.
 * @param {HTMLElement} difficultyButton The difficulty button.
 * @param {HTMLElement} newGameButton The new game button.
 * @param {HTMLElement} solveButton The solve button.
 * @param {Array} completedGroups The array of completed groups.
 * @param {SupabaseClient} supabaseClient The Supabase client.
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Array} groups The array of group sizes.
 * @param {Array} allTiles The array of all tiles.
 * @param {Set} previousSubmissions The set of previously submitted tiles.
 * @param {Set} selectedTiles The set of selected tiles.
 * @param {Array} positions The array of positions for the tiles.
 * @param {HTMLCanvasElement} board The board element.
 * @param {Object} tileSize The tile size object.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} rows The number of rows in the board.
 * @param {number} cols The number of columns in the board.
 */
export const clickNewGame = async (
  shuffleButton,
  submitButton,
  deselectButton,
  difficultyButton,
  newGameButton,
  solveButton,
  completedGroups,
  supabaseClient,
  remainngTiles,
  groups,
  allTiles,
  previousSubmissions,
  selectedTiles,
  positions,
  board,
  tileSize,
  gaps,
  rows,
  cols
) => {
  // Disable the buttons until the game is reset
  disableButtons([
    shuffleButton,
    submitButton,
    deselectButton,
    difficultyButton,
    newGameButton,
    solveButton,
  ]);

  clearBanners(completedGroups);

  await resetGame(
    supabaseClient,
    difficultyButton.dataset.difficulty,
    groups,
    allTiles,
    previousSubmissions,
    selectedTiles,
    remainngTiles,
    completedGroups,
    positions
  );

  clickShuffle(
    remainngTiles,
    positions,
    board,
    completedGroups,
    tileSize,
    gaps,
    rows,
    cols
  );

  // Enable the buttons
  enableButtons([
    shuffleButton,
    submitButton,
    deselectButton,
    difficultyButton,
    newGameButton,
    solveButton,
  ]);
};

/**
 * Shuffles the remaining tiles and redraws the board.
 * @param {Set} remainngTiles A set of remaining tiles.
 * @param {Array} positions An array of positions to shuffle.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Array} completedGroups An array of completed groups.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} rows The number of rows on the board.
 * @param {number} cols The number of columns on the board.
 */
export const clickShuffle = (
  remainngTiles,
  positions,
  board,
  completedGroups,
  tileSize,
  gaps,
  rows,
  cols
) => {
  shuffleBoard(remainngTiles, positions, getLayout());

  drawBoard(
    board,
    positions,
    remainngTiles,
    completedGroups,
    tileSize,
    gaps,
    rows,
    cols
  );
};

/**
 * Deselects all currently selected tiles.
 * Removes the "selected" CSS class from each tile's button and clears the set of selected tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 */
export const clickDeselect = (selectedTiles) => {
  for (const tile of selectedTiles) {
    tile.button.classList.remove("selected");
  }

  selectedTiles.clear();
};

/**
 * Solves the game by repeatedly calling solveNextGroup until all tiles are
 * cleared, and then enables the new game button.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 * @param {Array} completedGroups The array of completed groups.
 * @param {Array} groups The array of group sizes.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Object} tileSize The tile size object.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {Array} buttonsToDisable An array of buttons to disable during the solve process.
 * @param {HTMLButtonElement} newGameButton The new game button to enable after the solve process.
 */
export const clickSolve = async (
  board,
  remainngTiles,
  selectedTiles,
  completedGroups,
  groups,
  positions,
  tileSize,
  gaps,
  buttonsToDisable,
  newGameButton
) => {
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  disableButtons([newGameButton]);
  disableButtons(buttonsToDisable);

  const iteration = async () => {
    solveNextGroup(
      completedGroups,
      groups,
      selectedTiles,
      remainngTiles,
      positions
    );

    drawBoard(
      board,
      positions,
      remainngTiles,
      completedGroups,
      tileSize,
      gaps,
      rows,
      cols
    );

    await delay(1000);
  };

  while (remainngTiles.size > 0) {
    await iteration();
  }

  enableButtons([newGameButton]);
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
 * @param {Set} remainngTiles A set of remaining tiles.
 * @param {Array} positions An array of positions for the tiles.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Array} completedGroups An array of completed groups.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} rows The number of rows on the board.
 * @param {number} cols The number of columns on the board.
 */
export const clickApply = (
  settingsPanel,
  blurOverlay,
  remainngTiles,
  positions,
  board,
  completedGroups,
  tileSize,
  gaps,
  rows,
  cols
) => {
  const selectLayout = document.getElementById("select-layout");
  const layout = selectLayout.value;
  const oldLayout = getLayout();

  if (layout !== oldLayout) {
    setLayout(layout);

    const numOfCompletedGroups = completedGroups.reduce(
      (acc, group) => (group.tiles.length > 0 ? acc + 1 : acc),
      0
    );

    // Update free positions
    positions.length = 0;
    positions.push(...makePositions(rows - numOfCompletedGroups, cols));

    clickShuffle(
      remainngTiles,
      positions,
      board,
      completedGroups,
      tileSize,
      gaps,
      rows,
      cols
    );
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
