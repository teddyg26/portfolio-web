# Asset sources

- JetBrains Mono regular (400) and semibold (600): downloaded from the Google Fonts CSS API for https://fonts.google.com/specimen/JetBrains+Mono. The SIL Open Font License is included in `fonts/OFL.txt`.
- `icons/github.svg`: unmodified `GitHub_Invertocat_Black.svg` from https://brand.github.com/GitHub_Logos.zip, linked at https://brand.github.com/foundations/logo.
- `icons/linkedin.svg`: the `inbug-blue-28` SVG path embedded in https://brand.linkedin.com/downloads, saved as a standalone SVG with black fill. The page's downloadable icon ZIP contains PNGs only, so the site's SVG is used instead.

The logo paths are also inlined in `public/index.html` using `currentColor`, retaining their original proportions. They follow the active palette and transition to its primary text color over 200 ms on hover and keyboard focus.
