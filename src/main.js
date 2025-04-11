const themeToggleButton = document.getElementById("theme-toggle-button");

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");

  if (document.body.classList.contains("dark-theme")) {
    themeToggleButton.textContent = "☀️";
  } else {
    themeToggleButton.textContent = "🌙";
  }
});
