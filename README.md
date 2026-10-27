# MatchMind AI — Frontend Starter

A responsive HTML/CSS/vanilla JavaScript sports analytics interface.

## Run locally
1. Download and unzip `matchmind-ai.zip`.
2. Open `index.html` in a modern browser.
3. For a more production-like local environment, serve the folder using a static server (for example, VS Code Live Server or `python -m http.server 8000`) and open `http://localhost:8000`.

No build step or API key is required for the local demo.

## Files
- `index.html` — semantic page structure, navigation, modal and sections.
- `style.css` — responsive dark/light theme and components.
- `script.js` — rendering, filtering, theme, modal and settled-record accuracy calculation.
- `data.js` — clearly labelled illustrative fixtures and normalization helper.
- `api.js` — provider-independent async fetch layer with timeout, error handling, and session cache.
- `assets/` — reserved for local team logos, fonts and other assets.

## Demo-data policy
Fixtures, team names, scores and market selections are illustrative placeholders. They are not live fixtures or verified predictions. The demo intentionally shows no probability values and no historical accuracy because it has no calibrated model or settled historical records.

## Connect a real provider
1. Create a backend endpoint such as `GET /api/matches` that calls your licensed sports-data provider.
2. Keep provider API credentials on the backend in environment variables or a secret manager. Do not put API keys in `api.js` or any browser bundle.
3. Normalize provider responses to the shape used in `data.js`:
   `id, sport, league, country, date, status, home, away, homeCode, awayCode, market, selection, score, confidence, probability, reason, analysis, source, updated`.
4. In `api.js`, set `DEFAULT_ENDPOINT = "/api/matches"` or configure the endpoint in the `fetchFixtures` call. The endpoint should return either an array of normalized fixtures or `{ "matches": [...] }`.
5. Use ISO 8601 timestamps and document the timezone. The interface currently displays times in UTC.
6. Implement server-side rate limiting, validation, caching, source attribution, provider terms compliance and safe error messages.

## Prediction model integration
- Football baseline: fit team attack/defence strengths from historical goals and use a Poisson scoreline model to estimate goal distributions, 1X2 and totals. Validate out-of-sample, calibrate probabilities and report Brier score/log loss.
- Basketball baseline: estimate possessions and points per possession from verified offensive/defensive efficiency, then account for lineup availability, rest and home court. Validate and calibrate against historical games.
- Keep model execution behind a backend endpoint, such as `POST /api/predictions`, and return `modelVersion`, `inputTimestamp`, `sourceIds`, probabilities, projected score and uncertainty metadata.
- Never treat missing injuries, xG, pace, or player metrics as zero. Mark unavailable values explicitly.
- Confidence labels should be tied to pre-defined evidence-quality and uncertainty rules, not chosen arbitrarily.

## Results tracking
Populate `settledPredictions` in `data.js` only with predictions whose outcome has been confirmed and evaluated. Each record should include `settled: true`, `correct: boolean`, `settledAt`, sport, league, market, prediction ID and model version. Pending matches must not be included in accuracy.

## Features requiring a backend or external data
Live fixtures, live scores, current standings, injuries, verified recent form, xG/shots/efficiency metrics, model inference, historical settled results, account authentication, cloud favorites, premium access and subscriptions all need a backend and/or licensed external services. Payment collection must use a trusted payment provider and should never be implemented by storing card details in this frontend.

## Before production
- Replace demo data and placeholder contact address.
- Add real privacy and terms pages.
- Validate API data, timestamps, team IDs, competition IDs and prediction output schemas.
- Add automated tests, accessibility checks, security headers, server-side rate limiting and monitoring.
- Do not publish performance claims without reproducible settled prediction history.
