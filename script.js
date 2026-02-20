let musics = JSON.parse(localStorage.getItem("musics")) || [];
let activeTag = null;
let showFavoritesOnly = false;
let searchQuery = "";
let sortMode = "recent";
let playlists = JSON.parse(localStorage.getItem("playlists")) || [];
let activePlaylist = null;
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let editingPlaylistId = null;
let publicLibrary = [];
let logoClickCount = 0;
let logoClickTimer;
const ADMIN_PASSWORD = "jk_admin1"; // você pode mudar

loadTheme();
renderThemeMenu();
loadPublicLibrary();

function saveToStorage() {
  localStorage.setItem("musics", JSON.stringify(musics));
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

function render() {
  const grid = document.getElementById("musicGrid");
  grid.innerHTML = "";

let source = musics;
let filtered = [...source];

if (activeTag) {
  filtered = filtered.filter(m => m.tags.includes(activeTag));
}

if (showFavoritesOnly) {
  filtered = filtered.filter(m => m.favorite);
}

if (searchQuery) {
  filtered = filtered.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

if (activePlaylist) {
  const playlist = playlists.find(p => p.id === activePlaylist);
  if (playlist) {
    filtered = filtered.filter(m =>
      playlist.musicIds.includes(m.id)
    );
  }
}

switch (sortMode) {
  case "recent":
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    break;

  case "old":
    filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    break;

  case "az":
    filtered.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
    break;

  case "za":
    filtered.sort((a, b) =>
      (b.name || "").localeCompare(a.name || "")
    );
    break;
}

filtered.forEach((music, index) => {

  grid.innerHTML += `
    <div class="card">
      <img src="${music.cover}">
      
      <span class="fav-btn ${music.favorite ? "active" : ""}"
        onclick="toggleFavorite(${index})">♥</span>

      <h3>${music.name}</h3>

      <div>
        ${(music.tags || []).map(tag =>
          `<span class="tag">${tag}</span>`
        ).join("")}
      </div>

      <button class="button" onclick="copyID('${music.id}')">
        Copiar ID
      </button>

      <button class="button" onclick="removeMusic(${index})">
        Remover
      </button>
    </div>
  `;
});

  renderTags();
  renderPlaylists();
}

function renderTags() {
  const container = document.getElementById("tagFilters");
  container.innerHTML = "";

  const allTags = [...new Set(musics.flatMap(m => m.tags))];

  allTags.forEach(tag => {
    const isActive = tag === activeTag ? "selected" : "";

    container.innerHTML += `
      <span class="tag tag-select ${isActive}" 
            onclick="filterTag('${tag}')">  
        ${tag}
      </span>
    `;
  });
}

function filterTag(tag) {
  activeTag = tag === activeTag ? null : tag;
  render();
}

function copyID(id) {
  navigator.clipboard.writeText(id);
  alert("ID copiado: " + id);
}

function removeMusic(index) {
  musics.splice(index, 1);
  saveToStorage();
  render();
}

function openAddWindow() {
  document.getElementById("popup").classList.remove("hidden");
  renderExistingTags();
}

function closeAddWindow() {
  document.getElementById("popup").classList.add("hidden");
}

function renderExistingTags() {
  const container = document.getElementById("existingTags");
  container.innerHTML = "";

  const allTags = [...new Set(musics.flatMap(m => m.tags))];

  allTags.forEach(tag => {
    container.innerHTML += `
    <span class="tag tag-select" onclick="toggleTag(this)">
        ${tag}
    </span>
    `;
  });
}

function toggleTag(el) {
  el.classList.toggle("selected");
}

function saveMusic() {
  const name = document.getElementById("musicName").value.trim();
  const id = document.getElementById("musicID").value.trim();
  const cover = document.getElementById("musicCover").value.trim();
  const newTag = document.getElementById("newTag").value.trim();

  if (!name || !id || !cover) return;

  let selectedTags = Array.from(
    document.querySelectorAll("#existingTags .selected")
  ).map(el => el.textContent);

  if (newTag) selectedTags.push(newTag.trim());

  selectedTags = selectedTags.map(tag => tag.trim());

  selectedTags = [...new Set(selectedTags)];

musics.push({
  name,
  id,
  cover,
  tags: selectedTags.length ? selectedTags : [],
  favorite: false,
  createdAt: Date.now()
});

  saveToStorage();
  closeAddWindow();
  render();
}

function toggleFavorite(index) {
  musics[index].favorite = !musics[index].favorite;
  saveToStorage();
  render();
}

function toggleFavoritesView() {
  showFavoritesOnly = !showFavoritesOnly;

  const btn = document.getElementById("favFilterBtn");
  btn.style.background = showFavoritesOnly ? "#8fa8b5" : "";

  render();
}

function handleSearch(input) {
  searchQuery = input.value;
  render();
}

function changeSort(mode) {
  sortMode = mode;
  render();
}

function renderPlaylists() {
  const container = document.getElementById("playlistList");
  if (!container) return;

  container.innerHTML = "";

  if (playlists.length === 0) {
    container.innerHTML = `
      <span style="font-size:12px;opacity:0.6;">
        Nenhuma playlist criada
      </span>
    `;
    return;
  }

  playlists.forEach(pl => {
    const selected = pl.id === activePlaylist ? "selected" : "";

    container.innerHTML += `
      <div class="playlist-row ${selected}">
        <span onclick="selectPlaylist('${pl.id}')">
          🎵 ${pl.name}
        </span>

        <div class="playlist-actions">
          <button onclick="editPlaylist('${pl.id}')">✏</button>
          <button onclick="deletePlaylist('${pl.id}')">🗑</button>
        </div>
      </div>
    `;
  });
}

function editPlaylist(id) {
  const playlist = playlists.find(p => p.id === id);
  if (!playlist) return;

  editingPlaylistId = id;

  document.getElementById("playlistPopup").classList.remove("hidden");
  document.querySelector("#playlistPopup .titlebar span").textContent = "Editar Playlist";

  document.getElementById("playlistName").value = playlist.name;

  renderPlaylistMusicList(playlist);
}

function openEditPlaylistPopup(playlist) {
  const popup = document.getElementById("playlistPopup");
  popup.classList.remove("hidden");

  // Muda título
  popup.querySelector(".titlebar span").textContent = "Editar Playlist";

  // Preenche nome
  document.getElementById("playlistName").value = playlist.name;

  renderPlaylistMusicList(playlist);
}

function deletePlaylist(id) {
  playlists = playlists.filter(p => p.id !== id);

  if (editingPlaylistId === id) {
    editingPlaylistId = null;
  }

  saveToStorage();
  render();
}

function selectPlaylist(id) {
  activePlaylist = id === activePlaylist ? null : id;
  render();
  renderPlaylists();
}

function addToPlaylist(musicId) {
  if (!activePlaylist) {
    alert("Selecione uma playlist primeiro!");
    return;
  }

  const playlist = playlists.find(p => p.id === activePlaylist);
  if (!playlist.musicIds.includes(musicId)) {
    playlist.musicIds.push(musicId);
    saveToStorage();
    alert("Adicionado à playlist!");
  }
}

function openPlaylistPopup() {
  editingPlaylistId = null;

  document.getElementById("playlistPopup").classList.remove("hidden");

  // RESETAR TÍTULO
  document.querySelector("#playlistPopup .titlebar span").textContent = "Criar Playlist";

  document.getElementById("playlistName").value = "";
  renderPlaylistMusicList();
}

function closePlaylistPopup() {
  document.getElementById("playlistPopup").classList.add("hidden");

  editingPlaylistId = null;

  document.querySelector("#playlistPopup .titlebar span").textContent = "Criar Playlist";

  document.getElementById("playlistName").value = "";
}

function renderPlaylistMusicList(playlist = null) {
  const container = document.getElementById("playlistMusicList");
  container.innerHTML = "";

  musics.forEach(music => {
    const checked = playlist && playlist.musicIds.includes(music.id)
      ? "checked"
      : "";

    container.innerHTML += `
      <label class="playlist-item">
        <span>${music.name}</span>
        <input type="checkbox" value="${music.id}" ${checked}>
      </label>
    `;
  });
}

function savePlaylist() {
  const name = document.getElementById("playlistName").value.trim();
  if (!name) return;

  const selected = Array.from(
    document.querySelectorAll("#playlistMusicList input:checked")
  ).map(el => el.value);

  if (editingPlaylistId) {
    const playlist = playlists.find(p => p.id === editingPlaylistId);

    if (playlist) {
      playlist.name = name;
      playlist.musicIds = selected;
    } else {
      // Se não existe mais (foi deletada), cria nova
      playlists.push({
        id: Date.now().toString(),
        name,
        musicIds: selected
      });
    }
  } else {
    playlists.push({
      id: Date.now().toString(),
      name,
      musicIds: selected
    });
  }

  saveToStorage();
  closePlaylistPopup();
  render();
}

function openCredits() {
  document.getElementById("creditsPopup").classList.remove("hidden");
}

function closeCredits() {
  document.getElementById("creditsPopup").classList.add("hidden");
}

function handleLogoClick() {
  logoClickCount++;

  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => {
    logoClickCount = 0;
  }, 2000);

  // Se clicar 5 vezes → Easter Egg
  if (logoClickCount === 5) {
    activateEasterEgg();
    logoClickCount = 0;
    return;
  }

  // Se for clique normal → abre créditos
  openCredits();
}

window.addEventListener("load", () => {
  if (localStorage.getItem("devUnlocked") === "true") {
    const btn = document.getElementById("devModeBtn");
    if (btn) {
      btn.classList.remove("hidden");
    }
  }
});

document.querySelectorAll(".popup").forEach(popup => {
  const windowEl = popup.querySelector(".popup-window");
  const titlebar = popup.querySelector(".titlebar");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titlebar.addEventListener("mousedown", (e) => {
    isDragging = true;

    const rect = windowEl.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    windowEl.style.left = rect.left + "px";
    windowEl.style.top = rect.top + "px";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    windowEl.style.left = (e.clientX - offsetX) + "px";
    windowEl.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
});

function exportBackup() {

  const backup = {
    musics: musics,
    playlists: playlists,
    theme: localStorage.getItem("appTheme"),
    version: "1.0"
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "boombox-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function triggerImport() {
  document.getElementById("importInput").click();
}

function importBackup(event) {

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    try {

      const data = JSON.parse(e.target.result);

      if (!data.musics || !Array.isArray(data.musics)) {
        alert("Arquivo inválido.");
        return;
      }

      musics = data.musics;
      playlists = data.playlists || [];

      localStorage.setItem("musics", JSON.stringify(musics));
      localStorage.setItem("playlists", JSON.stringify(playlists));

      if (data.theme) {
        localStorage.setItem("appTheme", data.theme);
      }

      alert("Backup restaurado com sucesso!");
      location.reload();

    } catch {
      alert("Erro ao importar arquivo.");
    }

  };

  reader.readAsText(file);
}

async function loadPublicLibrary() {
  try {
    const response = await fetch("library.json");
    publicLibrary = await response.json();
  } catch (err) {
    console.error("Erro ao carregar biblioteca pública:", err);
  }
}

function saveFromPublic(id) {
  const music = publicLibrary.find(m => m.id === id);
  if (!music) return;

  // Evitar duplicado
  const alreadyExists = musics.some(m => m.id === id);
  if (alreadyExists) {
    alert("Essa música já está na sua biblioteca!");
    return;
  }

  musics.push({
    name: music.title || music.name,
    id: music.id,
    cover: music.cover || "https://via.placeholder.com/150",
    tags: music.tags || [],
    favorite: false,
    createdAt: Date.now()
  });

  saveToStorage();
  render();
  alert("Música salva na sua biblioteca!");
}

function openAdminPanel() {
  const pass = prompt("Digite a senha de admin:");

  if (pass !== ADMIN_PASSWORD) {
    alert("Senha incorreta.");
    return;
  }

  document.getElementById("adminPopup").classList.remove("hidden");
  renderAdminPublicList();
}

function closeAdminPanel() {
  document.getElementById("adminPopup").classList.add("hidden");
}

function addPublicMusic() {
  const title = document.getElementById("adminTitle").value.trim();
  const id = document.getElementById("adminID").value.trim();
  const cover = document.getElementById("adminCover").value.trim();
  const tagsInput = document.getElementById("adminTags").value.trim();

  if (!title || !id) return;

  const tags = tagsInput
    ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  publicLibrary.push({
    title,
    id,
    cover: cover || "https://via.placeholder.com/150",
    tags: tags
  });

  document.getElementById("adminTitle").value = "";
  document.getElementById("adminID").value = "";
  document.getElementById("adminCover").value = "";
  document.getElementById("adminTags").value = "";

  renderAdminPublicList();
}

function renderAdminPublicList() {
  const container = document.getElementById("adminPublicList");
  container.innerHTML = "";

  publicLibrary.forEach((music, index) => {
    container.innerHTML += `
      <div style="font-size:12px;margin-bottom:6px;">
        ${music.title}
        <button onclick="removePublicMusic(${index})">🗑</button>
      </div>
    `;
  });
}

function removePublicMusic(index) {
  publicLibrary.splice(index, 1);
  renderAdminPublicList();
}

function exportPublicLibrary() {
  const blob = new Blob(
    [JSON.stringify(publicLibrary, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "library.json";
  a.click();

  URL.revokeObjectURL(url);
}

const adminCode = "admin";
let adminTyped = "";

document.addEventListener("keydown", (e) => {
  adminTyped += e.key.toLowerCase();

  if (adminTyped.length > adminCode.length) {
    adminTyped = adminTyped.slice(-adminCode.length);
  }

  if (adminTyped === adminCode) {
    document.getElementById("adminBtn").classList.remove("hidden");
    alert("Modo admin desbloqueado.");
    adminTyped = "";
  }
});

function openPublicPopup() {
  document.getElementById("publicPopup").classList.remove("hidden");
  renderPublicPopup();
}

function closePublicPopup() {
  document.getElementById("publicPopup").classList.add("hidden");
}

function renderPublicPopup() {
  const grid = document.getElementById("publicGrid");
  grid.innerHTML = "";

  publicLibrary.forEach(music => {
    grid.innerHTML += `
      <div class="card">
        <img src="${music.cover || "https://via.placeholder.com/150"}">
        <h3>${music.title}</h3>
        <div>
          ${(music.tags || []).map(tag =>
            `<span class="tag">${tag}</span>`
          ).join("")}
        </div>
        <button class="button" onclick="saveFromPublic('${music.id}')">
          Salvar
        </button>
      </div>
    `;
  });
}

render();