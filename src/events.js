import { submitToast, repositionTiles } from "./ui";
import { makePositions } from "./utils";
import { TOAST_ERROR } from "./toasts";
import { processNewCompletedGroup } from "./gameLogic";

/**
 * Event handler for the submit button.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 * @param {Set} previousSubmissions The set of previously submitted tiles.
 * @param {Array} completedGroups An array of completed groups.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @param {HTMLButtonElement} submitButton The submit button.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @returns {Array} An array of positions for the tiles.
 */
export const clickSubmit = (
  board,
  remainngTiles,
  selectedTiles,
  previousSubmissions,
  completedGroups,
  groups,
  submitButton,
  positions,
  tileSize,
  hgap,
  vgap
) => {
  const { toast, newlyCompletedGroup } = submitToast(
    selectedTiles,
    previousSubmissions,
    groups
  );

  // Should never happen
  if (toast === null) {
    console.error("Toast is null");
    TOAST_ERROR.showToast();
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
  }

  return positions;
};
