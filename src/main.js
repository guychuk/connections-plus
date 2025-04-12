import { setThemeButtonText } from "./ui";

// Set the theme togggle button functionality
// and the initial text based on the current theme

const themeToggleButton = document.getElementById("theme-toggle-button");

setThemeButtonText(themeToggleButton);

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  setThemeButtonText(themeToggleButton);
});
