const API_BASE = "https://lespronos2mada-backend.onrender.com/api";

async function loadLeagues() {
    try {
        const response = await fetch(`${API_BASE}/leagues`);
        const data = await response.json();
        console.log(data);
        // Mets ici ton affichage
    } catch (err) {
        document.body.innerHTML = "Erreur API. Essaie plus tard.";
    }
}

async function loadLeagueFixtures(leagueId) {
    try {
        const response = await fetch(`${API_BASE}/fixtures/${leagueId}`);
        const data = await response.json();
        console.log(data);
        // Affichage
    } catch (err) {
        document.body.innerHTML = "Erreur API (clé ? quota ?). Réessaie plus tard.";
    }
}

loadLeagues();
