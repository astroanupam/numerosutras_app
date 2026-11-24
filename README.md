# NUMEROSUTRAS

Multi-stream numerology engine – Pythagorean, Chaldean, Vedic, Lo Shu and Kabbalah – with a transit analyser, profile files, publishable reports and an About Us page.

- **Languages:** English, हिन्दी, Русский, Español, Italiano, العربية (right-to-left)
- **Theme:** light, dark or automatic · **Text size:** A− / A+ (80 %–160 %)
- **One code base** for the website, the Windows desktop app and the mobile app (installable PWA, works offline)
- **Private:** profiles are stored only in the browser of the device; nothing is uploaded

Developed by Anoopam Shukla (AstroSutras) with Shweta Vijayvarrgiya (NumeroSutras).

## The 11 files

| File | Purpose |
|---|---|
| `index.html` | Page shell |
| `styles.css` | Theme, layout, print styles |
| `engine.js` | All calculations (no interface code) |
| `i18n.js` | Interface text in six languages |
| `content.js` | Rule register and interpretation wording in six languages |
| `app.js` | Interface: Numerology, Transits, Files, Report, About Us |
| `manifest.webmanifest` | Makes the site installable as an app |
| `sw.js` | Offline support |
| `icon-192.png`, `icon-512.png` | App icons |
| `README.md` | This file |

## Publish on GitHub Pages

1. Create a new public repository on github.com (for example `numerosutras`).
2. **Add file → Upload files**, drag in all 11 files, **Commit changes**.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, **Save**.
4. After a minute the app is live at `https://<your-user-name>.github.io/numerosutras/`.

When you upload a new version, change the `CACHE` name at the top of `sw.js` (for example `numerosutras-v1.0.1`) so installed copies refresh.

## Windows desktop app

Open the live address in **Microsoft Edge** or **Google Chrome**, then choose **Install app** (the button in the header, or the install icon in the address bar). NUMEROSUTRAS gets its own window, Start-menu entry and taskbar icon and works offline.

## Mobile app

- **Android (Chrome):** open the address → menu ⋮ → **Install app / Add to Home screen**.
- **iPhone / iPad (Safari):** open the address → Share → **Add to Home Screen**.

## Try it on this computer

The app must be served over http (not opened as a file) for install and offline mode:

```
python -m http.server 8765
```

then open `http://localhost:8765`.

## Disclaimer

Numerology is a traditional, belief-based framework, not a scientifically established method. Nothing in the app predicts outcomes; it is not professional advice.
