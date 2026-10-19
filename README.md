# Asteroid Doge

A tiny Canvas dodge-'em-up. Steer the doge with arrows / WASD / touch and survive as long as you can.
Built with plain JavaScript and Vite; no runtime dependencies.

## Develop

    npm install
    npm run dev        # local dev server with hot reload
    npm run build      # static site into dist/

## Deploy (GitHub -> Plesk)

1. Push to `master`. The GitHub Action in `.github/workflows/deploy.yml` builds the game and
   force-pushes the built files to a branch named `deploy`.
2. In Plesk (Websites & Domains -> Deploy using Git) create a remote repository for
   `https://github.com/hingohongo-ai/asteroidDoge.git`, branch `deploy`, mode Automatic,
   deployment directory = the site's document root.
3. Add the repository's webhook URL (shown in Plesk) to the GitHub repo under
   Settings -> Webhooks so pushes trigger a deploy.

## Layout

    index.html          page shell
    src/main.js         game loop, input, drawing
    src/style.css       full-screen canvas styling
    vite.config.js      relative base so it works on any domain/folder
