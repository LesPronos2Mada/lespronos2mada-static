const API_BASE = "https://lespronos2mada-backend.onrender.com/api";

// Sélecteurs HTML
const home = document.getElementById('home');
const list = document.getElementById('list');
const title = document.getElementById('title');
const backBtn = document.getElementById('back');

// → Retour
backBtn.addEventListener("click", () => {
    home.style.display = "block";
    list.style.display = "none";
});

// ----------------------------
// ✅ Charger l'accueil (boutons ligues)
// ----------------------------
async function loadLeagues() {
    // Pas besoin de récupérer les ligues via API
    title.innerText = "Les Pronos 2 Mada";
    home.style.display = "block";
    list.style.display = "none";

    // Activation des boutons
    document.getElementById("ligue1").onclick = () => loadLeagueFixtures(61);
    document.getElementById("premierleague").onclick = () => loadLeagueFixtures(39);
    document.getElementById("laliga").onclick = () => loadLeagueFixtures(140);
    document.getElementById("seriea").onclick = () => loadLeagueFixtures(135);
    document.getElementById("bundesliga").onclick = () => loadLeagueFixtures(78);
    document.getElementById("ucl").onclick = () => loadLeagueFixtures(2);
}

// ----------------------------
// ✅ Charger les Matchs d’une Ligue
// ----------------------------
async function loadLeagueFixtures(leagueId) {
    try {
        home.style.display = "none";
        list.style.display = "block";

        title.innerText = "Compétitions";

        const response = await fetch(`${API_BASE}/fixtures?league=${leagueId}`);
        const fixtures = await response.json();

        if (!Array.isArray(fixtures)) {
            list.innerHTML = "<p>Erreur API. Réessaie plus tard.</p>";
            return;
        }

        if (fixtures.length === 0) {
            list.innerHTML = "<p>Aucun match trouvé aujourd’hui.</p>";
            return;
        }

        // ✅ Affichage des matchs
        list.innerHTML = fixtures.map(match => `
            <div class="match">
                <div class="teams">
                    <span>${match.home.name}</span>
                    <span>vs</span>
                    <span>${match.away.name}</span>
                </div>
                <div class="info">
                    <small>${match.date}</small>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        list.innerHTML = "Erreur API (clé ? quota ?). Réessaie plus tard.";
    }
}

// ✅ Lancer l’app
loadLeagues();
