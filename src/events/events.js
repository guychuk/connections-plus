import {
  submitToast,
  showErrorScreen,
  win,
  getDifficultyButtonText,
  spin,
  setLayout,
  drawBoard,
  getLayout,
  shuffleBoard,
  disableButtons,
  enableButtons,
  clearBanners,
} from "../components/ui";
import { resetGame } from "../core/gameLogic";
import { makePositions } from "../core/utils";

/**
 * Event handler for the submit button.
 * @param {MouseEvent} event The event when the user clicks the submit button.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 * @param {Set} previousSubmissions The set of previously submitted tiles.
 * @param {Array} completedGroups An array of completed groups.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
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
  hgap,
  vgap,
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

  if (newlyCompletedGroup !== null) {
    const groupIndex = newlyCompletedGroup[0].groupIndex;
    completedGroups[groupIndex].tiles = newlyCompletedGroup;

    for (let tile of selectedTiles) {
      remainngTiles.delete(tile);
      selectedTiles.delete(tile);
      tile.button.classList.remove("selected");
      tile.button.classList.add("hidden");
      tile.button.classList.add(`group-${groupIndex + 1}`);
      tile.button.classList.add(`completed`);
      tile.button.disabled = true;
    }

    // const rows = groups.length - numOfCompletedGroups;
    const rows = groups.length;
    const cols = groups[groups.length - 1];

    const numOfCompletedGroups = completedGroups.reduce(
      (acc, group) => (group.tiles.length > 0 ? acc + 1 : acc),
      0
    );

    // Update free positions
    positions.length = 0;

    positions.push(...makePositions(rows - numOfCompletedGroups, cols));

    drawBoard(
      board,
      positions,
      remainngTiles,
      completedGroups,
      tileSize,
      hgap,
      vgap,
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
    win();
  }

  if (remainngTiles.size === 0) {
    disableButtons([
      shuffleButton,
      submitButton,
      deselectButton,
      difficultyButton,
    ]);
  }

  return positions;
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

  button.textContent = getDifficultyButtonText(button.dataset.difficulty);
};

export const clickNewGame = async (
  shuffleButton,
  submitButton,
  deselectButton,
  difficultyButton,
  newGameButton,
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
  hgap,
  vgap,
  rows,
  cols
) => {
  disableButtons([
    shuffleButton,
    submitButton,
    deselectButton,
    difficultyButton,
    newGameButton,
  ]);

  clearBanners(completedGroups);

  await resetGame(
    supabaseClient,
    difficultyButton,
    remainngTiles.size === 0,
    groups,
    allTiles,
    previousSubmissions,
    selectedTiles,
    completedGroups,
    positions
  );

  remainngTiles.clear();

  for (const tile of allTiles) {
    remainngTiles.add(tile);
  }

  clickShuffle(
    remainngTiles,
    positions,
    board,
    completedGroups,
    tileSize,
    hgap,
    vgap,
    rows,
    cols
  );

  enableButtons([
    shuffleButton,
    submitButton,
    deselectButton,
    difficultyButton,
    newGameButton,
  ]);
};

/**
 * Event handler for the settings button.
 * Toggles the blur effect and visibility of the settings panel.
 * @param {MouseEvent} event The event when the user clicks the settings button.
 */

export const clickSettings = (event) => {
  spin(event);

  // const settingsButton = event.currentTarget;

  const settingsPanel = document.getElementById("settings-panel");

  const selectLayout = document.getElementById("select-layout");

  const blurOverlay = document.getElementById("blur-overlay");

  blurOverlay.classList.toggle("blurred");

  settingsPanel.classList.toggle("blurred");

  selectLayout.value = getLayout();
};

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

export const clickApply = (
  remainngTiles,
  positions,
  board,
  completedGroups,
  tileSize,
  hgap,
  vgap,
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
      hgap,
      vgap,
      rows,
      cols
    );
  }
};

export const clickShuffle = (
  remainngTiles,
  positions,
  board,
  completedGroups,
  tileSize,
  hgap,
  vgap,
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
    hgap,
    vgap,
    rows,
    cols
  );
};
