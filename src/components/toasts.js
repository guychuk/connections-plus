import Toastify from "toastify-js";
import { toastsDuration as TOAST_DURATION } from "../config/config.json";

/**
 * Creates a Toastify message.
 * @param {Array} classes An array of classes to apply to the Toastify message.
 * @param {string} text The text to display in the Toastify message.
 * @param {number} duration The time the toast is on the screen in ms.
 * @returns {Object} A Toastify message object.
 */
export const makeToast = (classes, text, duration = TOAST_DURATION) => {
  const classesString = classes.join(" ");

  return Toastify({
    text: text,
    duration: duration,
    gravity: "top",
    position: "left",
    stopOnFocus: true,
    className: classesString,
  });
};

/**
 * Creates a Toastify message for when the user has too few tiles selected.
 * @param {number} minChoice The minimum number of tiles that can be selected.
 * @returns {Object} A Toastify message object.
 */
export const makeTooFewToast = (minChoice) =>
  makeToast(
    ["toastify-rounded", "toastify-invalid-choice"],
    `🚫 You need to select at least ${minChoice} tiles to submit`
  );

/**
 * Creates a Toastify message for when the user has too many tiles selected.
 * @param {number} maxChoice The maximum number of tiles that can be selected.
 * @returns {Object} A Toastify message object.
 */
export const makeTooManyToast = (maxChoice) =>
  makeToast(
    ["toastify-rounded", "toastify-invalid-choice"],
    `🚫 You need to select at most ${maxChoice} tiles to submit`
  );

/**
 * Creates a Toastify message for when the user has submitted a partially correct set of tiles.
 * @param {number} correct The number of correctly selected tiles.
 * @param {number} group The group size of the tiles.
 * @returns {Object} A Toastify message object.
 */
export const makePartialToast = (correct, group) =>
  makeToast(
    ["toastify-rounded", "toastify-partial"],
    `🚀 You got ${correct} out of ${group} correct!`
  );

export const makeErrorToast = () =>
  makeToast(["toastify-rounded", "toastify-error"], "🫠 Something went wrong");

export const makeDuplicateToast = () =>
  makeToast(
    ["toastify-rounded", "toastify-duplicate"],
    `🚫 You already submitted that`
  );

export const makeCorrectToast = () =>
  makeToast(["toastify-rounded", "toastify-correct"], "🎉 You got it!");

export const makeIncorrectToast = () =>
  makeToast(["toastify-rounded", "toastify-incorrect"], "❌ That's not it...");

export const makeWinnerToast = () =>
  makeToast(["toastify-rounded", "toastify-winner"], "🎉 You won!", -1);

export const makeLoserToast = () =>
  makeToast(["toastify-rounded", "toastify-loser"], "👎 You lost!", -1);
