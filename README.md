# Kensei AI — GitHub + Cloudflare + Gemini

This folder is the complete project. Keep the folder structure exactly as shown:

```text
public/index.html
src/index.js
wrangler.jsonc
package.json
README.md
```

## GitHub upload

1. Extract this ZIP on your phone.
2. In your GitHub repository, remove the old root-level `index.html` and `index.js` after confirming the new folders are present.
3. Upload the contents of this folder while preserving the `public` and `src` folders. Do not upload this ZIP as a replacement for the project files.
4. Confirm `src/index.js` and `public/index.html` are visible in the repository on the `main` branch.

## Cloudflare Workers Builds

Use repository root `/`.
- Build command: leave blank (or use the default install behavior)
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler deploy --dry-run` (optional)

The `package.json` declares Wrangler so the build environment can install it.

## Gemini key — after deployment

Create a Gemini API key in Google AI Studio. In Cloudflare, open the `kensei-ai` Worker → Settings → Variables and Secrets → Add → Secret. Set the name to `GEMINI_API_KEY` and paste the key as the secret value. Never put the key in GitHub or in `public/index.html`.

Then open `/api/health` on your deployed site. It should return `{"ok":true,"provider":"Gemini"}`.

Gemini and Cloudflare free plans have quotas and rate limits; this project does not bypass them.
