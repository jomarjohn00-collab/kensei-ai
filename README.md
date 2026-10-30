# Kensei AI — Cloudflare + Gemini

This project removes the Claude-host dependency and connects the existing Kensei AI interface to Gemini through a Cloudflare Worker.

## What is included

- `public/index.html` — Kensei AI interface, updated to call `/api/chat`
- `src/index.js` — secure Worker proxy; the Gemini key stays server-side
- `wrangler.jsonc` — Cloudflare Worker + static assets configuration

## You need

- A Cloudflare account
- A Gemini API key from Google AI Studio
- Node.js on a computer for the command-line deployment

## 1. Add your Gemini key

Create a key in Google AI Studio: https://aistudio.google.com/app/apikey

Treat the key like a password. Do not paste it into `public/index.html`, GitHub, or a chat.

## 2. Deploy

Open a terminal in this project folder and run:

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

When asked for `GEMINI_API_KEY`, paste the key into the terminal prompt. It is stored as a Worker secret, not in the website files.

The deployment command prints your `workers.dev` website address.

## 3. Test

Open the deployed website. The status line should say `Kensei AI · Gemini backend ready`.
Send a simple test message such as `Say hello in one sentence.`

## Optional model setting

The Worker defaults to `gemini-2.5-flash`. You can set a different supported Gemini model as a Worker variable named `GEMINI_MODEL`, if you know that model is available to your API project.

## Important notes

- Gemini free-tier access has quotas and rate limits. This setup does not bypass them.
- Never expose your API key in browser JavaScript.
- Image attachments are sent to Gemini as image input; supported image types are JPEG, PNG, WebP, and GIF.
- The chat interface stores saved conversations in the browser's local storage.
- Basic static hosting and Worker requests have separate Cloudflare plan limits.
