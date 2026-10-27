/*
 * MatchMind AI demo data.
 * Every fixture and model estimate here is illustrative, not a real-world forecast.
 * Replace this dataset with normalized, verified API responses in production.
 */
window.MatchMindData = (() => {
  const fixtures = [
    {id:"demo-f-001",sport:"football",league:"Premier League",country:"England",date:"2026-10-28T19:00:00Z",status:"upcoming",home:"Northbridge FC",away:"Harbor Athletic",homeCode:"NF",awayCode:"HA",market:"Double Chance",selection:"Northbridge FC or Draw (1X)",score:"1–1",confidence:"Low",probability:null,reason:"Illustrative example only. A real assessment needs verified recent performance, squad availability and market-independent model inputs.",analysis:{form:"Unavailable in demo mode. Connect a trusted results feed.",homeAway:"No verified home/away split is included.",stats:"xG, shots, goals and defensive metrics are not supplied.",availability:"No verified player availability data connected.",tactics:"Tactical notes require current team and match context.",uncertainties:["Lineups and late injuries are unknown.","No calibrated probability model is connected.","Fixture details are illustrative."]},source:"Local illustrative dataset",updated:"Not available"},
    {id:"demo-f-002",sport:"football",league:"La Liga",country:"Spain",date:"2026-10-28T20:00:00Z",status:"upcoming",home:"Valencia Coast",away:"Royal Sierra",homeCode:"VC",awayCode:"RS",market:"Goals",selection:"Under 3.5 goals (illustrative)",score:"1–0",confidence:"Low",probability:null,reason:"A total-goals view normally depends on expected-goal distributions and team scoring rates; neither is connected here.",analysis:{form:"No verified recent results available.",homeAway:"Home and away splits are unavailable.",stats:"No xG, shots or goal-rate data supplied.",availability:"Not verified.",tactics:"Unavailable without reliable team information.",uncertainties:["No goal model or historical calibration.","Team and match labels are demo placeholders."]},source:"Local illustrative dataset",updated:"Not available"},
    {id:"demo-f-003",sport:"football",league:"Serie A",country:"Italy",date:"2026-10-29T18:45:00Z",status:"upcoming",home:"Lakeview Calcio",away:"Capital United",homeCode:"LC",awayCode:"CU",market:"1X2",selection:"Draw (illustrative)",score:"1–1",confidence:"Low",probability:null,reason:"Illustrative card demonstrating the 1X2 market. No real forecast or probability is being claimed.",analysis:{form:"Not connected.",homeAway:"Not connected.",stats:"Expected goals and shots are not available.",availability:"No verified injury feed.",tactics:"No evidence-based tactical report connected.",uncertainties:["No current data feed.","No calibrated statistical model."]},source:"Local illustrative dataset",updated:"Not available"},
    {id:"demo-b-001",sport:"basketball",league:"NBA",country:"United States",date:"2026-10-28T23:30:00Z",status:"upcoming",home:"Metro Comets",away:"Summit Wolves",homeCode:"MC",awayCode:"SW",market:"Winner",selection:"Metro Comets (illustrative)",score:"108–104",confidence:"Low",probability:null,reason:"A genuine basketball projection needs offensive/defensive efficiency, expected possessions, verified availability and schedule context.",analysis:{form:"Recent results and efficiency metrics are not connected.",homeAway:"Home-court adjustment is not estimated in this demo.",stats:"Offensive rating, defensive rating and pace are unavailable.",availability:"No verified injury or player-status feed.",tactics:"No lineup or matchup data available.",uncertainties:["No projected possessions or points-per-possession inputs.","Scoreline is illustrative only."]},source:"Local illustrative dataset",updated:"Not available"},
    {id:"demo-b-002",sport:"basketball",league:"EuroLeague",country:"Europe",date:"2026-10-29T18:00:00Z",status:"upcoming",home:"Bluegate BC",away:"Eastern Towers",homeCode:"BB",awayCode:"ET",market:"Points",selection:"Total points market (not modelled)",score:"82–79",confidence:"Low",probability:null,reason:"Total points are not estimated because verified pace, scoring efficiency and player availability are absent.",analysis:{form:"Not connected.",homeAway:"Not connected.",stats:"Possessions and efficiency metrics are unavailable.",availability:"No verified player availability data.",tactics:"No matchup inputs available.",uncertainties:["No calibrated total-points model.","Sample score is not a prediction."]},source:"Local illustrative dataset",updated:"Not available"}
  ];
  // Settled records must be real and verified before adding them to this array.
  const settledPredictions = [];
  function normalizeFixture(f) {
    return {
      id:String(f.id), sport:f.sport, league:f.league || "Competition unavailable",
      country:f.country || "Country unavailable", date:f.date || null,
      status:f.status || "upcoming", home:f.home || "Home team unavailable",
      away:f.away || "Away team unavailable", homeCode:f.homeCode || "H",
      awayCode:f.awayCode || "A", market:f.market || "Not available",
      selection:f.selection || "No model output", score:f.score || "Not available",
      confidence:f.confidence || "Low", probability:Number.isFinite(f.probability) ? f.probability : null,
      reason:f.reason || "Analysis unavailable.", analysis:f.analysis || {},
      source:f.source || "Source unavailable", updated:f.updated || "Timestamp unavailable",
      isDemo:!!f.isDemo || String(f.id).startsWith("demo-")
    };
  }
  return {fixtures:fixtures.map(normalizeFixture), settledPredictions, normalizeFixture};
})();