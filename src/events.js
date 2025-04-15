import { submitToast } from "./ui";

/**
 * Event handler for the submit button.
 * @param {Set} remainngTiles - The set of remaining tiles.
 * @param {Set} selectedTiles - The set of currently selected tiles.
 * @param {Set} previousSubmissions - The set of previously submitted tiles.
 * @param {Array} completedGroups - An array of completed groups.
 * @param {Array} groups - An array of group sizes in the game, sorted.
 * @param {HTMLButtonElement} submitButton - The submit button.
 */
export const clickSubmit = (
  remainngTiles,
  selectedTiles,
  previousSubmissions,
  completedGroups,
  groups,
  submitButton
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
  }

  console.log(completedGroups);

  // When pressing the button fast enough, the toasts get stuck.
  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
  }, 2000);
};
