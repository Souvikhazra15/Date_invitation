# Will You Go On A Date With Me?

A playful, responsive date invitation inspired by the supplied screenshots. Built with React, Vite, Framer Motion and Lucide React.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`, then preview it with `npm run preview`.

## Customize

All invitation copy, event details, theme colors and the optional music path live in `src/config.js`. Add a properly licensed `background-music.mp3` to `public/assets/` to enable the music control.

## EmailJS setup

Add your EmailJS public key to `.env`:

```bash
VITE_EMAILJS_SERVICE_ID=service_o4ke6mg
VITE_EMAILJS_TEMPLATE_ID=template_1r4uorp
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

Restart Vite after changing `.env`. The service and template IDs are already configured; sending is available after the public key is added.

In **EmailJS Dashboard → Account → Security → Domains**, add each origin used locally or publicly:

```text
http://localhost:5173
http://127.0.0.1:5173
https://your-deployed-domain.example
```

Do not enable "Allow EmailJS API for non-browser applications" unless server-side calls are intentional. Do not store an EmailJS private key in this React project.

## Deploy

### Netlify

Create a new site from the project repository. Set the build command to `npm run build` and the publish directory to `dist`.

### GitHub Pages

Build with `npm run build`, then publish the generated `dist` folder using a Pages workflow or a static hosting action. If the repository is hosted below a path, set Vite's `base` option to that path in `vite.config.js`.
