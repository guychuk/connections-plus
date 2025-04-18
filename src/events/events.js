import {
  submitToast,
  repositionTiles,
  showErrorScreen,
  win,
  getDifficultyButtonText,
} from "../components/ui";
import { processNewCompletedGroup } from "../core/gameLogic";

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
 * @returns {Array} An array of positions for the tiles.
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
  vgap
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

    // Remove them from tiles
    for (let tile of selectedTiles) {
      remainngTiles.delete(tile);
      tile.button.classList.remove("selected");
      tile.button.classList.add("hidden");
      tile.button.classList.add(`completed-${groupIndex + 1}`);
      tile.button.disabled = true;
    }

    // Update free positions
    positions = processNewCompletedGroup(selectedTiles, groups, positions);

    repositionTiles(
      board,
      remainngTiles,
      completedGroups,
      groups,
      positions,
      tileSize,
      hgap,
      vgap
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
  prevSubs,
  selected,
  completed,
  positions
) => {
  // Clear game state
  prevSubs.clear();
  selected.clear();

  // Clear completed groups
  for (let i = 0; i < completed.length; i++) {
    completed[i].tiles.length = 0;

    // Remove completed group button/banner
    if (completed[i].button) {
      completed[i].button.classList.add("hidden");

      setTimeout(() => {
        completed[i].button.remove();
        completed[i].button = null;
      }, 500);
    }
  }
};
