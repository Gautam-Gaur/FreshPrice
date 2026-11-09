# FreshPrice

Responsive React price page for Bhavesh (Durga) Fruits and Vegetables.

The page reads the current vegetable names, Hindi names, prices, units, categories and availability from the published CSV for the Google Sheets `Prices` tab. Keep the sheet limited to information intended for the public page. If a vegetable is marked `No`, it is hidden from the customer page. Price changes can take a few minutes to appear because Google caches published data.

## Run locally

1. Install Node.js 20.19+ (or Node.js 22.12+).
2. Run `npm install`.
3. Run `npm run dev` and open the local address shown in the terminal.

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the Vite app and deploys it to GitHub Pages when code is pushed to `main`. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The repository must have Pages enabled and Actions permissions allowed.
