# WIC-WVARR Resource Directory

A static GitHub Pages directory for recovery housing referrals. Uses the provided WVARR list; not a live availability system.

## Publish
1. Create a new **public** GitHub repository (e.g. `WIC-WVARR-Resource-Directory`).
2. Upload `index.html`, `style.css`, `app.js`, and `programs.json` to the repository root.
3. Open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, `main`, `/ (root)`, then **Save**.
4. Visit `https://YOUR-USERNAME.github.io/WIC-WVARR-Resource-Directory/` after deployment.

## Updating data
Edit `programs.json`. Each residence is a separate entry. Bed capacity is **not** real-time availability.

## Location accuracy
The map attempts high-confidence address geocoding; otherwise it shows approximate city-center pins. Multiple residences at one location are slightly offset for visibility. Verify each location before travel. ArcGIS endpoint access can vary, so map remains usable with approximate locations when geocoding is unavailable. City-only listings are always approximate. No participant data is collected by this static website, but map tile and geocoding providers receive normal network requests. Do not put sensitive participant information in the search box.

## Attribution
Directory provided by the project owner. Verify publication permissions and data currency with WVARR. No WVARR or WIC logo/endorsement is implied.
