const API_KEY = "YOUR_API_FOOTBALL_KEY"; // <- mets ta clé ici
const API = "https://v3.football.api-sports.io";

const home = document.getElementById("home");
const list = document.getElementById("list");
const matchesEl = document.getElementById("matches");

document.querySelectorAll("[data-lid]").forEach(b => b.onclick = () => loadLeague(b.dataset.lid));
document.getElementById("back").onclick = () => {
  list.classList.add("hidden");
  home.classList.remove("hidden");
  matchesEl.innerHTML = "";
};

async function api(path, params = {}) {
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function loadLeague(leagueId) {
  home.classList.add("hidden");
  list.classList.remove("hidden");
  matchesEl.innerHTML = "<div>Chargement…</div>";
  try {
    const today = new Date().toISOString().slice(0,10);
    const fx = await api("/fixtures", { league: leagueId, date: today, season: new Date().getFullYear() });
    const rows = (fx.response || []).map(x => ({
      id: x.fixture.id,
      date: x.fixture.date,
      home: { id: x.teams.home.id, name: x.teams.home.name },
      away: { id: x.teams.away.id, name: x.teams.away.name }
    }));

    if (!rows.length) { matchesEl.innerHTML = "<div>Aucun match aujourd’hui.</div>"; return; }
    matchesEl.innerHTML = "";

    // petit Poisson basique à partir des moyennes buts (fallback 1.3/1.2 si pas dispo)
    for (const m of rows) {
      let p = { pH: 0.0, pD: 0.0, pA: 0.0, over25: 0.0 };

      try {
        const yr = new Date().getFullYear();
        const [H, A] = await Promise.all([
          api("/teams/statistics", { league: leagueId, team: m.home.id, season: yr }),
          api("/teams/statistics", { league: leagueId, team: m.away.id, season: yr })
        ]);

        const xgH = (H.response?.goals?.for?.average?.total) || 1.3;
        const xgA = (A.response?.goals?.for?.average?.total) || 1.2;

        function fact(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
        function pois(k,lambda){ return Math.exp(-lambda)*Math.pow(lambda,k)/fact(k); }

        for (let s1=0; s1<=7; s1++){
          for (let s2=0; s2<=7; s2++){
            const pr = pois(s1,xgH)*pois(s2,xgA);
            if (s1>s2) p.pH+=pr; else if (s1===s2) p.pD+=pr; else p.pA+=pr;
            if (s1+s2>=3) p.over25+=pr;
          }
        }
      } catch(e) {
        // en cas d’échec API : on laisse à 0
      }

      const el = document.createElement("div");
      el.className = "match";
      el.innerHTML = `
        <div>
          <div><strong>${m.home.name}</strong> vs <strong>${m.away.name}</strong></div>
          <div class="small">1: ${(p.pH*100).toFixed(1)}% • N: ${(p.pD*100).toFixed(1)}% • 2: ${(p.pA*100).toFixed(1)}% • O2.5: ${(p.over25*100).toFixed(1)}%</div>
        </div>
        <div class="small">${new Date(m.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      `;
      matchesEl.appendChild(el);
    }
  } catch (e) {
    matchesEl.innerHTML = "<div>Erreur API (clé ? quota ?). Réessaie plus tard.</div>";
  }
}
