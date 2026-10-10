# Asset sources

- `gmtk-game-preview.webp`: Ted's gameplay screenshot (`Screenshot 2026-10-10 at 12.56.37 AM.png`), cropped to the game area (1920×1080 at +536+402) with a 60-pixel rounded alpha mask. Encoded using ImageMagick as lossless WebP with method 6; the source resolution is retained.
- `zig-schsim-preview.webp`: Ted's terminal screenshot (`Screenshot 2026-10-10 at 12.40.15 AM.png`), cropped to the macOS window (1296×994 at +14+14) with a 40-pixel rounded alpha mask. Encoded using ImageMagick as lossless WebP with method 6; the source resolution is retained.
- JetBrains Mono regular (400) and semibold (600): downloaded from the Google Fonts CSS API for https://fonts.google.com/specimen/JetBrains+Mono. The SIL Open Font License is included in `fonts/OFL.txt`.
- `icons/github.svg`: unmodified `GitHub_Invertocat_Black.svg` from https://brand.github.com/GitHub_Logos.zip, linked at https://brand.github.com/foundations/logo.
- `icons/linkedin.svg`: the `inbug-blue-28` SVG path embedded in https://brand.linkedin.com/downloads, saved as a standalone SVG with black fill. The page's downloadable icon ZIP contains PNGs only, so the site's SVG is used instead.
- `icons/play.svg` and `icons/pause.svg`: unmodified Lucide SVGs from https://github.com/lucide-icons/lucide/tree/main/icons. The upstream license is included in `icons/LUCIDE-LICENSE.txt`. CSS masks let the overlay icons use the active theme's text color.

The logo paths are also inlined in `public/index.html` using `currentColor`, retaining their original proportions. They follow the active palette and transition to its primary text color over 200 ms on hover and keyboard focus.
