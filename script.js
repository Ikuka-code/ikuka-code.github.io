const themeButton = document.querySelector("#theme-toggle");

// 原生 button 支援滑鼠、Enter 與空白鍵，不需要額外鍵盤事件。
themeButton.addEventListener("click", () => {
  const isLight = document.documentElement.dataset.theme !== "light";
  document.documentElement.dataset.theme = isLight ? "light" : "dark";
  themeButton.setAttribute("aria-pressed", String(isLight));
  themeButton.textContent = isLight ? "切換為深色" : "切換為淺色";
});
