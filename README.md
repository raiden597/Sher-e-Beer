# 🦁 Sher-e-Beer

The lion doesn't drink alone. Show it, share a beer.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build     # outputs static files to /dist
npm run preview   # preview the production build
```

## Deploy

Pure static output — drop it anywhere.

- **Vercel:** `vercel` (or import the repo; framework auto-detected as Vite)
- **Netlify:** build command `npm run build`, publish dir `dist`

## Structure

```
index.html        → entry + font links
src/main.jsx      → React mount
src/App.jsx       → the whole app (state + bubbles)
src/index.css     → all styling
```

## Ideas to extend

- `who's buying?` coin-flip
- running beer counter (per session)
- name field → personalized cheers ("Cheers, Karan!")
- shareable link per session
