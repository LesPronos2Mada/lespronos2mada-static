const API_BASE = "https://www.thesportsdb.com/api/v1/json/3";

const LEAGUE_IDS = {
    "61": "4334",
    "39": "4328",
    "140": "4335",
    "135": "4332",
    "78": "4331",
    "667": "4480"
};

async function fetchFixtures(leagueKey) {
    try {
        const leagueId = LEAGUE_IDS[leagueKey];
        if (!leagueId) return [];

        const url = `${API_BASE}/eventsnextleague.php?id=${leagueId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.events) return [];

        return data.events.map(ev => ({
            home: ev.strHomeTeam,
            away: ev.strAwayTeam,
            date: ev.dateEvent + " " + (ev.strTime || "")
        }));
    } catch (e) {
        console.error("Erreur fixtures:", e);
        return [];
    }
}

async function loadLeague(leagueKey) {
    document.getElementById("match-list").innerHTML =
        `<div class="loading">Chargement...</div>`;

    const matches = await fetchFixtures(leagueKey);

    if (matches.length === 0) {
        document.getElementById("match-list").innerHTML =
            `<div class="empty">Aucun match trouvé.</div>`;
        return;
    }

    document.getElementById("match-list").innerHTML = matches
        .map(m => `
        <div class="match">
            <div class="teams">${m.home} vs ${m.away}</div>
            <div class="time">${m.date}</div>
            <button class="pronos-btn" onclick="openPronos('${m.home}', '${m.away}')">Pronos</button>
        </div>
    `).join("");
}

function openPronos(home, away) {
    const lambdaHome = 1.2;
    const lambdaAway = 1.0;

    const pHome = poisson(1, lambdaHome);
    const pAway = poisson(1, lambdaAway);

    alert(`🔥 ${home} vs ${away}
Probabilité ${home} : ${Math.round(pHome * 100)}%
Probabilité ${away} : ${Math.round(pAway * 100)}%`);
}

function poisson(k, lambda) {
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
