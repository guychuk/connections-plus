import Toastify from "toastify-js";
import {
  toastsDuration as TOAST_DURATION,
  UIText,
} from "../config/config.json";
import { getLanguage } from "./ui";

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
export const makeTooFewToast = (minChoice) => {
  const language = getLanguage();

  const text = UIText[language].toasts.tooFew.replace("XXX", minChoice);

  return makeToast(["toastify-rounded", "toastify-invalid-choice"], text);
};

/**
 * Creates a Toastify message for when the user has too many tiles selected.
 * @param {number} maxChoice The maximum number of tiles that can be selected.
 * @returns {Object} A Toastify message object.
 */
export const makeTooManyToast = (maxChoice) => {
  const language = getLanguage();

  const text = UIText[language].toasts.tooMany.replace("XXX", maxChoice);

  return makeToast(["toastify-rounded", "toastify-invalid-choice"], text);
};

/**
 * Creates a Toastify message for when the user has submitted a partially correct set of tiles.
 * @param {number} correct The number of correctly selected tiles.
 * @param {number} group The group size of the tiles.
 * @returns {Object} A Toastify message object.
 */
export const makePartialToast = (correct, group) => {
  const language = getLanguage();

  const text = UIText[language].toasts.partial
    .replace("XXX", correct)
    .replace("YYY", group);

  return makeToast(["toastify-rounded", "toastify-partial"], text);
};

export const makeErrorToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-error"],
    UIText[language].toasts.error
  );
};

export const makeDuplicateToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-error"],
    UIText[language].toasts.duplicate
  );
};

export const makeCorrectToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-correct"],
    UIText[language].toasts.correct
  );
};

export const makeIncorrectToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-incorrect"],
    UIText[language].toasts.incorrect
  );
};

export const makeWinnerToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-winner"],
    UIText[language].toasts.winner,
    -1
  );
};

export const makeLoserToast = () => {
  const language = getLanguage();

  return makeToast(
    ["toastify-rounded", "toastify-loser"],
    UIText[language].toasts.loser,
    -1
  );
};
