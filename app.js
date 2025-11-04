const API_BASE = "https://lespronos2mada-backend.onrender.com/api";

// Sélecteurs HTML
const home = document.getElementById("home");
const list = document.getElementById("list");
const matches = document.getElementById("matches");
const backBtn = document.getElementById("back");

// ✅ Bouton retour
backBtn.addEventListener("click", () => {
  home.classList.remove("hidden");
  list.classList.add("hidden");
});

// ✅ Click sur les boutons ligues (data-lid)
document.querySelectorAll("[data-lid]").forEach(btn => {
  btn.addEventListener("click", () => {
    const leagueId = btn.getAttribute("data-lid");
    loadLeagueFixtures(leagueId);
  });
});

// ✅ Charger les matchs d’une ligue
async function loadLeagueFixtures(leagueId) {
  try {
    home.classList.add("hidden");
    list.classList.remove("hidden");

    matches.innerHTML = "<div>Chargement…</div>";

    const response = await fetch(`${API_BASE}/fixtures?league=${leagueId}`);
    const fixtures = await response.json();

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      matches.innerHTML = "<p>Aucun match trouvé aujourd’hui.</p>";
      return;
    }

    matches.innerHTML = fixtures
      .map(match => `
      <div class="match">
        <div>
          <div><strong>${match.home.name}</strong> vs <strong>${match.away.name}</strong></div>
          <div class="small">${new Date(match.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        </div>
      </div>
    `)
      .join("");

  } catch (err) {
    console.error(err);
    matches.innerHTML = "<p>Erreur API. Réessaie plus tard.</p>";
  }
}
