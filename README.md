# Worldwise — Currency & World Exchange Explorer

A responsive static website built with plain HTML, CSS and JavaScript. It is designed for GitHub Pages.

## Features
- Currency converter powered by the Frankfurter v2 API.
- Currency catalogue loaded dynamically (including legacy codes where supplied by the API).
- Historical exchange-rate chart for selectable currency pairs and time windows.
- An editorial timeline covering major milestones in the history of money.
- Country selector loaded from REST Countries.
- Exchange-location discovery using OpenStreetMap Nominatim + Overpass.
- Responsive mobile navigation and layout.

## Run locally
Open `index.html` in a browser, or use a local static server (recommended):
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Deploy to GitHub Pages
1. Create a GitHub repository (for example, `worldwise`).
2. Upload `index.html`, `styles.css`, `app.js`, and this README to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for the Pages URL to appear.

## Data coverage — important limitations
This is an API-connected global explorer, not a claim that one source contains every currency or every exchange business on Earth.

- **Exchange rates:** Frankfurter provides daily reference rates for a broad catalogue of currencies and historical series. It is not a live trading feed, does not cover every currency in existence, and some pairs may be unavailable. Rates are indicative mid-market reference rates, not the cash rate a money changer guarantees. See https://frankfurter.dev/.
- **Country list:** REST Countries supplies the country directory. The 195-country count is a common convention; territories and disputed recognition can vary by dataset.
- **Exchange offices:** Locations are queried live from OpenStreetMap. Its data is community-maintained and incomplete. The search can only show businesses that have been mapped and tagged; it cannot provide a verified exhaustive directory for all 195 countries. Search by city for more manageable results. Always verify licensing, opening hours, fees, safety and rates directly with a provider.
- **Availability:** Third-party public APIs can change, rate-limit requests, or be temporarily unavailable. This project uses no API keys and no backend. For a production service, add caching, error monitoring, attribution, privacy review and a licensed business-data provider.

## APIs used
- Frankfurter: https://frankfurter.dev/ — rates, currency catalogue and time series.
- REST Countries: https://restcountries.com/ — country names and flag images.
- OpenStreetMap Nominatim: https://nominatim.org/ — country/city geocoding.
- OpenStreetMap Overpass API: https://overpass-api.de/ — mapped exchange-location search.
- OpenStreetMap: https://www.openstreetmap.org/ — map display.

Please respect each provider's usage policy. In particular, public Nominatim and Overpass instances are shared community services; avoid rapid repeated searches and do not build high-volume production traffic on public endpoints.

## Suggested next production upgrades
- Add a backend proxy with caching and rate limiting for geocoding/Overpass.
- Add a verified provider directory from licensed commercial data or official financial regulator registries.
- Add provider details, phone, hours, user reviews and verification workflow.
- Add accessibility testing, automated tests and API health monitoring.
