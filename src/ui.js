export const setThemeButtonText = (button) => {
  button.textContent = document.body.classList.contains("dark-theme")
    ? "☀️"
    : "🌙";
};
