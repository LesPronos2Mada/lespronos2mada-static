import express from "express";
import cors from "cors";
import compression from "compression";
import fetch from "node-fetch";

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json());

const TSDB_KEY  = process.env.THESPORTSDB_KEY || "3";
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;

const LEAGUES = {
  ligue1:     { id: 4334, name: "Ligue 1" },
  premier:    { id: 4328, name: "Premier League" },
  laliga:     { id: 4335, name: "LaLiga" },
  seriea:     { id: 4332, name: "Serie A" },
  bundesliga: { id: 4331, name: "Bundesliga" },
  ucl:        { id: 4480, name: "Ligue des Champions" },
  uel:        { id: 4481, name: "Ligue Europa" },
  uecl:       { id: 4482, name: "Ligue Europa Conférence" }
};

app.get("/api/health", (req, res) => res.json({ ok: true, tsdb: TSDB_KEY }));

app.get("/api/leagues", (req, res) => {
  res.json(Object.entries(LEAGUES).map(([key, v]) => ({ key, id: v.id, name: v.name })));
});

async function tsdb(pathWithQuery){
  const url = `${TSDB_BASE}${pathWithQuery}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TSDB HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

app.get("/api/fixtures", async (req, res) => {
  try{
    let { league } = req.query;
    if (!league) return res.status(400).json({ error:"league required (key or id)" });

    let leagueId = Number(league);
    if (Number.isNaN(leagueId)){
      const v = LEAGUES[league];
      if (!v) return res.status(400).json({ error:"unknown league key" });
      leagueId = v.id;
    }

    const data = await tsdb(`/eventsnextleague.php?id=${leagueId}`);
    const events = data?.events || data?.event || [];

    const fixtures = events.map(ev => ({
      id: ev.idEvent,
      date: ev.dateEvent,
      time: ev.strTime || null,
      league: ev.strLeague,
      home: ev.strHomeTeam,
      away: ev.strAwayTeam,
      venue: ev.strVenue || null
    }));

    res.json(fixtures);
  }catch(e){
    res.status(500).json({ error: e.message });
  }
});

function fact(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function pois(k,a){ return Math.exp(-a)*Math.pow(a,k)/fact(k); }

const BASE_HOME_XG = 1.45;
const BASE_AWAY_XG = 1.15;

app.post("/api/probabilities", (req, res) => {
  try {
    const { strengthHome=1.0, strengthAway=1.0, maxGoals=7 } = req.body || {};
    const xgH = Math.max(0.2, BASE_HOME_XG * Number(strengthHome));
    const xgA = Math.max(0.2, BASE_AWAY_XG * Number(strengthAway));

    let pH=0,pD=0,pA=0, over25=0, grid=[];
    for (let s1=0; s1<=maxGoals; s1++){
      for (let s2=0; s2<=maxGoals; s2++){
        const p = pois(s1,xgH)*pois(s2,xgA);
        if (s1>s2) pH+=p; else if (s1===s2) pD+=p; else pA+=p;
        if (s1+s2>=3) over25+=p;
        grid.push({ s1, s2, p });
      }
    }
    grid.sort((a,b)=>b.p-a.p);
    const topScores = grid.slice(0,5).map(x=>({ score:`${x.s1}-${x.s2}`, p:+(x.p*100).toFixed(1) }));

    res.json({
      xgHome:+xgH.toFixed(2),
      xgAway:+xgA.toFixed(2),
      prob:{
        home:+(pH*100).toFixed(1),
        draw:+(pD*100).toFixed(1),
        away:+(pA*100).toFixed(1),
        over25:+(over25*100).toFixed(1)
      },
      topScores
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("LP2M alt backend live on " + PORT));