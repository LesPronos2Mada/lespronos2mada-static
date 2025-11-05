// LP2M — Front 100% statique (TheSportsDB public key 3)
const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

const LEAGUES = [
  { key:"ligue1", id:4334, name:"Ligue 1" },
  { key:"premier", id:4328, name:"Premier League" },
  { key:"laliga", id:4335, name:"LaLiga" },
  { key:"seriea", id:4332, name:"Serie A" },
  { key:"bundesliga", id:4331, name:"Bundesliga" },
  { key:"ucl", id:4480, name:"Ligue des Champions" }
];

const home = document.getElementById("home");
const list = document.getElementById("list");
const leagueGrid = document.getElementById("leagueGrid");
const matchesEl = document.getElementById("matches");
const backBtn = document.getElementById("backBtn");
const refreshBtn = document.getElementById("refreshBtn");
const currentLeague = document.getElementById("currentLeague");

const modal = document.getElementById("pronoModal");
const modalTitle = document.getElementById("modalTitle");
const pronoResult = document.getElementById("pronoResult");
const strengthHome = document.getElementById("strengthHome");
const strengthAway = document.getElementById("strengthAway");
const valH = document.getElementById("valH");
const valA = document.getElementById("valA");
document.getElementById("closeModal").onclick = () => modal.close();
strengthHome.oninput = () => valH.textContent = (+strengthHome.value).toFixed(2);
strengthAway.oninput = () => valA.textContent = (+strengthAway.value).toFixed(2);

function renderLeagues(){
  leagueGrid.innerHTML = LEAGUES.map(l => `
    <div class="card">
      <button data-league="${l.id}" aria-label="${l.name}">${l.name}</button>
    </div>
  `).join("");
  document.querySelectorAll("[data-league]").forEach(btn => {
    btn.addEventListener("click", () => loadFixtures(btn.dataset.league));
  });
}
renderLeagues();

backBtn.addEventListener("click", () => {
  list.classList.remove("visible");
  home.classList.add("visible");
});

refreshBtn.addEventListener("click", () => {
  const lid = matchesEl.getAttribute("data-league");
  if (lid) loadFixtures(lid);
});

async function getJSON(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function loadFixtures(leagueId){
  try{
    home.classList.remove("visible");
    list.classList.add("visible");
    matchesEl.setAttribute("data-league", leagueId);
    const meta = LEAGUES.find(x => x.id == leagueId);
    currentLeague.textContent = meta ? meta.name : "Compétition";
    matchesEl.innerHTML = "Chargement...";

    const url = `${TSDB_BASE}/eventsnextleague.php?id=${leagueId}`;
    const j = await getJSON(url);
    const events = j?.events || j?.event || [];

    if (!events.length){
      matchesEl.innerHTML = "<p>Aucun match à venir trouvé.</p>";
      return;
    }

    matchesEl.innerHTML = events.map(ev => {
      const dt = (ev.dateEvent || "") + (ev.strTime ? " " + ev.strTime : "");
      const safeHome = (ev.strHomeTeam || "").replace(/"/g,'\\"');
      const safeAway = (ev.strAwayTeam || "").replace(/"/g,'\\"');
      return `
        <div class="match">
          <div class="teams">
            <div><b>${ev.strHomeTeam || "-"}</b> vs <b>${ev.strAwayTeam || "-"}</b></div>
            <div class="small">${dt}</div>
          </div>
          <div>
            <button class="btn primary" onclick="openProno(\"${safeHome}\", \"${safeAway}\")">Pronos</button>
          </div>
        </div>
      `;
    }).join("");

  }catch(e){
    matchesEl.innerHTML = "Erreur de chargement. Réessaie.";
    console.error(e);
  }
}

// Poisson simple
function fact(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function pois(k,a){ return Math.exp(-a)*Math.pow(a,k)/fact(k); }

const BASE_HOME_XG = 1.45;
const BASE_AWAY_XG = 1.15;

window.openProno = (homeTeam, awayTeam) => {
  modalTitle.textContent = `${homeTeam} vs ${awayTeam}`;
  strengthHome.value = "1.00"; valH.textContent = "1.00";
  strengthAway.value = "1.00"; valA.textContent = "1.00";
  runProno();
  modal.showModal();
};

[strengthHome, strengthAway].forEach(el => el.addEventListener("input", runProno));

function runProno(){
  const sh = parseFloat(strengthHome.value || "1");
  const sa = parseFloat(strengthAway.value || "1");

  const xgH = Math.max(0.2, BASE_HOME_XG * sh);
  const xgA = Math.max(0.2, BASE_AWAY_XG * sa);

  let pH=0,pD=0,pA=0, over25=0, grid=[];
  const MAX=7;
  for(let s1=0;s1<=MAX;s1++){
    for(let s2=0;s2<=MAX;s2++){
      const p = pois(s1,xgH)*pois(s2,xgA);
      if (s1>s2) pH+=p; else if(s1===s2) pD+=p; else pA+=p;
      if (s1+s2>=3) over25+=p;
      grid.push({s1,s2,p});
    }
  }
  grid.sort((a,b)=>b.p-a.p);
  const top = grid.slice(0,5).map(x=>`${x.s1}-${x.s2} (${(x.p*100).toFixed(1)}%)`).join("\n");

  const txt =
`xG estimés:  ${xgH.toFixed(2)}  -  ${xgA.toFixed(2)}
Probas:
  Domicile : ${(pH*100).toFixed(1)}%
  Nul      : ${(pD*100).toFixed(1)}%
  Extérieur: ${(pA*100).toFixed(1)}%
  Over 2.5 : ${(over25*100).toFixed(1)}%

Scores probables:
${top}`;

  pronoResult.textContent = txt;
}
