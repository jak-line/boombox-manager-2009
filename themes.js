const themes = {
  "theme-default": { label: "Default" },
  "theme-dark": { label: "Dark" },
  "theme-vapor": { label: "Vaporwave" },
  "theme-xp": { label: "Windows XP" },
  "theme-matrix": { label: "Matrix Terminal" },
  "theme-y2k": {label: "Pink Y2K"},
  "theme-win98": { label: "Windows 98" },
  "theme-winamp": { label: "Winamp 2004" },
  "theme-emo": { label: "Emo 2008" },
  "theme-gameboy": { label: "GameBoy" }
};

function setTheme(theme) {
  document.body.classList.add("theme-switching");

  setTimeout(() => {
    document.body.className = theme;
    localStorage.setItem("appTheme", theme);
  }, 150);

  setTimeout(() => {
    document.body.classList.remove("theme-switching");
  }, 400);
}

function loadTheme() {
  const saved = localStorage.getItem("appTheme") || "theme-default";
  document.body.className = saved;
}

function renderThemeMenu() {
  const select = document.getElementById("themeSelect");
  if (!select) return;

  select.innerHTML = "";

  Object.keys(themes).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = themes[key].label;
    select.appendChild(option);
  });

  const saved = localStorage.getItem("appTheme") || "theme-default";
  select.value = saved;

  select.onchange = (e) => {
    setTheme(e.target.value);
  };
}

const secretCode = "memory"; // você pode mudar pra qualquer palavra
let typed = "";

document.addEventListener("keydown", (e) => {
  typed += e.key.toLowerCase();

  if (typed.length > secretCode.length) {
    typed = typed.slice(-secretCode.length);
  }

  if (typed === secretCode) {
    unlockSecretTheme();
    typed = "";
  }
});

function unlockSecretTheme() {

  // escurece lentamente
  document.body.style.transition = "opacity 1.5s ease, filter 1.5s ease";
  document.body.style.opacity = "0.3";
  document.body.style.filter = "blur(3px)";

  setTimeout(() => {

    document.body.classList.add("theme-faded");

    document.body.style.opacity = "1";
    document.body.style.filter = "blur(0px)";

  }, 1500);
}