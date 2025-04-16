import { submitToast, redrawBoard } from "./ui";
import { makePositions } from "./utils";

/**
 * Event handler for the submit button.
 * @param {Set} remainngTiles - The set of remaining tiles.
 * @param {Set} selectedTiles - The set of currently selected tiles.
 * @param {Set} previousSubmissions - The set of previously submitted tiles.
 * @param {Array} completedGroups - An array of completed groups.
 * @param {Array} groups - An array of group sizes in the game, sorted.
 * @param {HTMLButtonElement} submitButton - The submit button.
 * @param {Array} positions - An array of positions for the tiles.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 * @returns {Array} An array of positions for the tiles.
 */
export const clickSubmit = (
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

  if (toast === null) {
    console.error("Toast is null");
    return;
  }

  toast.showToast();

  if (newlyCompletedGroup !== null) {
    const groupIndex = newlyCompletedGroup[0].groupIndex;
    completedGroups[groupIndex] = newlyCompletedGroup;

    // also remove them from tiles
    for (let tile of selectedTiles) {
      remainngTiles.delete(tile);
      tile.button.classList.remove("selected");
      tile.button.classList.add(`completed-${groupIndex + 1}`);
      tile.button.disabled = true;
    }

    selectedTiles.clear();

    // Update free positions
    const cols = groups[groups.length - 1];
    const rows = positions.length / cols - 1;

    positions = makePositions(rows, cols);

    redrawBoard(
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
  setTimeout(() => {
    submitButton.disabled = false;
  }, 2000);

  return positions;
};
