import { setThemeButtonText } from "./ui";

const themeToggleButton = document.getElementById("theme-toggle-button");

setThemeButtonText(themeToggleButton);

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  setThemeButtonText(themeToggleButton);
});
