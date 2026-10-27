/* MatchMind AI frontend controller: rendering, filters, theme, modal and accuracy tracking. */
(() => {
  const $ = (selector) => document.querySelector(selector);
  let allFixtures = [];
  let visibleFixtures = [];
  let lastFocusedElement = null;
  let toastTimer;

  const els = {
    grid: $("#matchGrid"), empty: $("#emptyState"), loading: $("#loadingState"),
    error: $("#errorState"), search: $("#globalSearch"), sport: $("#sportFilter"),
    market: $("#marketFilter"), sort: $("#sortFilter"), modal: $("#analysisModal"),
    modalTitle: $("#modalTitle"), modalContent: $("#modalContent"), toast: $("#toast")
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[char]);
  }

  function formatDate(dateString) {
    if (!dateString) return "Date unavailable";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle:"medium", timeStyle:"short", timeZone:"UTC"
    }).format(date) + " UTC";
  }

  function confidenceClass(value) {
    return value === "High" ? "" : value === "Medium" ? "confidence-medium" : "confidence-low";
  }

  function marketGroup(fixture) {
    if (fixture.sport === "basketball") return fixture.market === "Points" ? "Points" : "Winner";
    if (fixture.market === "Goals") return "Goals";
    if (fixture.market === "Double Chance") return "Double Chance";
    return "1X2";
  }

  function renderCard(f) {
    const sportLabel = f.sport === "football" ? "FOOTBALL" : "BASKETBALL";
    const scoreLabel = f.sport === "football" ? "Illustrative scoreline" : "Illustrative final score";
    const probability = f.probability === null ? "Not modelled" : `${f.probability.toFixed(1)}% model estimate`;
    return `<article class="match-card">
      <div class="card-top"><span class="league-name">${escapeHTML(f.league)} · ${sportLabel}</span><span class="demo-badge">DEMO</span></div>
      <div class="teams-row">
        <div class="team"><span class="team-logo">${escapeHTML(f.homeCode)}</span><span class="team-name">${escapeHTML(f.home)}</span><span class="team-side">HOME</span></div>
        <span class="vs-label">VS</span>
        <div class="team"><span class="team-logo">${escapeHTML(f.awayCode)}</span><span class="team-name">${escapeHTML(f.away)}</span><span class="team-side">AWAY</span></div>
      </div>
      <div class="match-meta"><span>◷ ${escapeHTML(formatDate(f.date))}</span><span>${escapeHTML(f.status)}</span></div>
      <div class="prediction-box"><div class="prediction-label">ILLUSTRATIVE MARKET SELECTION</div><div class="prediction-pick">${escapeHTML(f.selection)}</div>
        <div class="score-line"><span>${escapeHTML(scoreLabel)}</span><b>${escapeHTML(f.score)}</b></div>
      </div>
      <p class="card-reason">${escapeHTML(f.reason)}</p>
      <div class="card-footer"><span class="confidence-badge ${confidenceClass(f.confidence)}">${escapeHTML(f.confidence)} confidence</span><span class="probability-note">${escapeHTML(probability)}</span></div>
      <div class="card-footer" style="margin-top:12px"><span class="probability-note">Illustrative · not live</span><button class="btn btn-secondary" data-analysis="${escapeHTML(f.id)}">View Full Analysis ↗</button></div>
    </article>`;
  }

  function applyFilters() {
    const query = els.search.value.trim().toLowerCase();
    const sport = els.sport.value;
    const market = els.market.value;
    visibleFixtures = allFixtures.filter((f) => {
      const matchesQuery = !query || [f.home, f.away, f.league, f.country].some(v => String(v).toLowerCase().includes(query));
      const matchesSport = sport === "all" || f.sport === sport;
      const matchesMarket = market === "all" || marketGroup(f) === market;
      return matchesQuery && matchesSport && matchesMarket;
    });
    visibleFixtures.sort((a,b) => {
      if (els.sort.value === "confidence") {
        const rank = {High:3, Medium:2, Low:1};
        return rank[b.confidence] - rank[a.confidence];
      }
      return new Date(a.date || 0) - new Date(b.date || 0);
    });
    els.grid.innerHTML = visibleFixtures.map(renderCard).join("");
    els.empty.classList.toggle("hidden", visibleFixtures.length !== 0);
    $("#fixtureCount").textContent = allFixtures.length;
    renderSportSummaries();
  }

  function renderSportSummaries() {
    const football = allFixtures.filter(f => f.sport === "football");
    const basketball = allFixtures.filter(f => f.sport === "basketball");
    $("#footballSummary").innerHTML = summaryHTML(football);
    $("#basketSummary").innerHTML = summaryHTML(basketball);
  }

  function summaryHTML(fixtures) {
    if (!fixtures.length) return `<div class="summary-chip">No fixtures match these filters.</div>`;
    const leagues = [...new Set(fixtures.map(f => f.league))];
    return `<div class="summary-chip"><b>${fixtures.length}</b> illustrative fixtures</div>
      <div class="summary-chip"><b>${leagues.length}</b> competitions</div>
      <div class="summary-chip">Statistics: <b>not connected</b></div>
      <div class="summary-chip">Injuries: <b>not verified</b></div>`;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400);
  }

  function analysisBlock(title, content, wide = false) {
    return `<section class="analysis-block ${wide ? "analysis-wide" : ""}"><h3>${escapeHTML(title)}</h3>${content}</section>`;
  }

  function openAnalysis(id, trigger) {
    const f = allFixtures.find(item => item.id === id);
    if (!f) return;
    lastFocusedElement = trigger || document.activeElement;
    els.modalTitle.textContent = `${f.home} vs ${f.away}`;
    const a = f.analysis || {};
    const list = (items) => `<ul>${(items || ["No verified detail available."]).map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul>`;
    const probText = f.probability === null ? "No probability is provided because a calibrated model is not connected." : `Model estimate: ${f.probability.toFixed(1)}%. Model version and calibration details must be supplied by the backend.`;
    els.modalContent.innerHTML = `
      <div class="analysis-grid">
        ${analysisBlock("Match information", `<p><b>Competition:</b> ${escapeHTML(f.league)} (${escapeHTML(f.country)})</p><p><b>Kickoff:</b> ${escapeHTML(formatDate(f.date))}</p><p><b>Status:</b> ${escapeHTML(f.status)}</p><p><b>Data mode:</b> Illustrative demo</p>`)}
        ${analysisBlock("Prediction snapshot", `<p><b>Market:</b> ${escapeHTML(f.market)}</p><p><b>Selection:</b> ${escapeHTML(f.selection)}</p><p><b>Expected score:</b> ${escapeHTML(f.score)} (illustrative)</p><p><b>Confidence:</b> ${escapeHTML(f.confidence)}</p><p>${escapeHTML(probText)}</p>`)}
        ${analysisBlock("Recent form & home/away performance", `<p>${escapeHTML(a.form || "Unavailable.")}</p><p>${escapeHTML(a.homeAway || "Unavailable.")}</p>`)}
        ${analysisBlock("Statistics", `<p>${escapeHTML(a.stats || "No verified statistics supplied.")}</p>`)}
        ${analysisBlock("Player availability", `<p>${escapeHTML(a.availability || "No verified availability data connected.")}</p>`)}
        ${analysisBlock("Tactical / stylistic matchup", `<p>${escapeHTML(a.tactics || "Unavailable without current evidence.")}</p>`)}
        ${analysisBlock("What could invalidate this view", list(a.uncertainties), true)}
        ${analysisBlock("Data provenance", `<p><b>Source:</b> ${escapeHTML(f.source)}</p><p><b>Last updated:</b> ${escapeHTML(f.updated)}</p><p>All displayed fixture and prediction details are demo content. This page does not fetch live sports data.</p>`, true)}
      </div>`;
    els.modal.classList.remove("hidden");
    $("#closeModal").focus();
    document.body.style.overflow = "hidden";
  }

  function closeAnalysis() {
    els.modal.classList.add("hidden");
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  }

  function updateAccuracy() {
    const settled = window.MatchMindData.settledPredictions.filter(p => p.settled === true && typeof p.correct === "boolean");
    const correct = settled.filter(p => p.correct).length;
    $("#evaluatedMetric").textContent = settled.length;
    $("#correctMetric").textContent = correct;
    $("#accuracyMetric").textContent = settled.length ? `${(correct / settled.length * 100).toFixed(1)}%` : "—";
    $("#settledCount").textContent = settled.length ? `${settled.length} evaluated` : "No settled demo records";
    const chart = $("#accuracyChart");
    if (!settled.length) {
      chart.className = "empty-chart";
      chart.innerHTML = `<span class="chart-empty-icon">⌁</span><strong>Not enough verified history yet</strong><small>No sample accuracy has been fabricated.</small>`;
      return;
    }
    const byDate = {};
    settled.forEach(p => {
      const key = p.settledAt ? String(p.settledAt).slice(0,10) : "Date unavailable";
      if (!byDate[key]) byDate[key] = {correct:0,total:0};
      byDate[key].total++; if (p.correct) byDate[key].correct++;
    });
    const rows = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b));
    chart.className = "accuracy-bars";
    chart.innerHTML = rows.map(([date, v]) => {
      const pct = v.total ? v.correct / v.total * 100 : 0;
      return `<div class="accuracy-row"><span>${escapeHTML(date)}</span><div><i style="width:${pct}%"></i></div><b>${pct.toFixed(0)}%</b></div>`;
    }).join("");
  }

  async function init() {
    els.loading.classList.remove("hidden");
    els.error.classList.add("hidden");
    try {
      async function init() {
       els.loading.classList.remove("hidden");
      els.error.classList.add("hidden");

    try {
      const SUPABASE_URL =
      "https://cydhljhhqzqgexmmvkct.supabase.co";

      const SUPABASE_KEY =
      "sb_publishable_m035JVbLCnHc-d2YKb_ncQ_3xpGiXKY";

      const response = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=id,sport,competition,home_team,away_team,match_date,market,selection,home_score,away_score,confidence,status,analysis&status=eq.published&order=match_date.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Supabase error: ${response.status}`
      );
    }

    const predictions = await response.json();

    allFixtures = predictions.map((p) => ({
      id: String(p.id),
      sport: p.sport,
      league: p.competition || "Other Competition",
      country: "",
      home: p.home_team,
      away: p.away_team,
      homeCode: (p.home_team || "H")
        .slice(0, 3)
        .toUpperCase(),
      awayCode: (p.away_team || "A")
        .slice(0, 3)
        .toUpperCase(),
      date: p.match_date,
      status: "Published",
      market: p.market,
      selection: p.selection,
      score:
        p.home_score != null && p.away_score != null
          ? `${p.home_score} - ${p.away_score}`
          : "Not provided",
      confidence:
        (p.confidence || "low").charAt(0).toUpperCase() +
        (p.confidence || "low").slice(1),
      probability: null,
      reason: p.analysis || "Analysis not provided.",
      source: "Supabase",
      updated: "Database record",
      analysis: {
        stats: p.analysis || "No additional analysis provided."
      }
    }));

    applyFilters();
    updateAccuracy();

  } catch (error) {
    els.error.textContent =
      error.message || "Could not load published predictions.";
    els.error.classList.remove("hidden");
    showToast("Match data could not be loaded.");
  } finally {
    els.loading.classList.add("hidden");
  }
}


    } catch (error) {
      els.error.textContent = error.message || "Could not load match data.";
      els.error.classList.remove("hidden");
      showToast("Match data could not be loaded.");
    } finally {
      els.loading.classList.add("hidden");
    }
  }

  els.search.addEventListener("input", applyFilters);
  [els.sport, els.market, els.sort].forEach(el => el.addEventListener("change", applyFilters));
  $("#clearFilters").addEventListener("click", () => {
    els.search.value = ""; els.sport.value = "all"; els.market.value = "all"; els.sort.value = "date";
    applyFilters(); showToast("Filters cleared.");
  });
  $("#focusSearch").addEventListener("click", () => { els.search.focus(); $("#predictions").scrollIntoView({behavior:"smooth"}); });
  $("#matchGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-analysis]");
    if (button) openAnalysis(button.dataset.analysis, button);
  });
  $("#closeModal").addEventListener("click", closeAnalysis);
  els.modal.addEventListener("click", (event) => { if (event.target === els.modal) closeAnalysis(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !els.modal.classList.contains("hidden")) closeAnalysis(); });

  $("#menuToggle").addEventListener("click", () => {
    const nav = $("#mainNav");
    const open = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
    $("#menuToggle").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $("#mainNav").addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      $("#mainNav").classList.remove("open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });

  const savedTheme = localStorage.getItem("matchmind-theme");
  if (savedTheme === "light") document.body.classList.add("light");
  $("#themeToggle").textContent = document.body.classList.contains("light") ? "☾" : "☼";
  $("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    const theme = document.body.classList.contains("light") ? "light" : "dark";
    try { localStorage.setItem("matchmind-theme", theme); } catch (_) {}
    $("#themeToggle").textContent = theme === "light" ? "☾" : "☼";
    showToast(`${theme[0].toUpperCase()}${theme.slice(1)} theme enabled.`);
  });

  $("#applyFootballFilters").addEventListener("click", () => {
    const date = $("#footballDate").value;
    const league = $("#footballLeague").value;
    const status = $("#footballStatus").value;
    els.search.value = "";
    els.sport.value = "football";
    els.market.value = "all";
    // Apply section filters by updating the global query and then narrowing the rendered list.
    const now = new Date();
    const target = new Date(now); target.setUTCDate(target.getUTCDate() + (date === "tomorrow" ? 1 : 0));
    const dayKey = target.toISOString().slice(0,10);
    const matches = allFixtures.filter(f => f.sport === "football" &&
      (league === "all" || f.league === league) &&
      (status === "all" || f.status === status) &&
      (date === "all" || (f.date && f.date.slice(0,10) === dayKey)));
    els.grid.innerHTML = matches.map(renderCard).join("");
    els.empty.classList.toggle("hidden", matches.length !== 0);
    $("#predictions").scrollIntoView({behavior:"smooth"});
    showToast(`${matches.length} football fixture(s) match your filters.`);
  });

  $("#applyBasketFilters").addEventListener("click", () => {
    const league = $("#basketLeague").value;
    const market = $("#basketMarket").value;
    const team = $("#basketTeam").value.trim().toLowerCase();
    const matches = allFixtures.filter(f => f.sport === "basketball" &&
      (league === "all" || (league === "Domestic" ? !["NBA","WNBA","EuroLeague"].includes(f.league) : f.league === league)) &&
      (market === "all" || f.market === market) &&
      (!team || `${f.home} ${f.away}`.toLowerCase().includes(team)));
    els.grid.innerHTML = matches.map(renderCard).join("");
    els.empty.classList.toggle("hidden", matches.length !== 0);
    $("#predictions").scrollIntoView({behavior:"smooth"});
    showToast(`${matches.length} basketball fixture(s) match your filters.`);
  });

  // Use a tiny CSS-based bar chart only for verified settled records.
  const style = document.createElement("style");
  style.textContent = ".accuracy-bars{display:grid;gap:12px;padding:20px 0}.accuracy-row{display:grid;grid-template-columns:100px 1fr 45px;gap:12px;align-items:center;font-size:10px;color:var(--muted)}.accuracy-row>div{height:8px;background:#25364b;border-radius:10px;overflow:hidden}.accuracy-row i{display:block;height:100%;background:var(--green);border-radius:10px}";
  document.head.appendChild(style);

  init();
})();
