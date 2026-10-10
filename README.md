# Portfolio website

## Local use

Use Bun 1.4.2 to install dependencies and build the CSS. Cloudflare's Wrangler
deployment CLI also needs a supported Node.js release, at least 22; Node 24 LTS
is suitable. Neither runtime runs on the hosted website, which is static HTML
and CSS. On macOS, install Bun with `brew install oven-sh/bun/bun` if needed.

```sh
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

Open the localhost URL printed by Wrangler. It rebuilds CSS when the HTML or
source CSS changes. Stop with Ctrl-C. To build without starting a server, use
`bun run build`; `bun run watch` watches just the CSS build.

Commit `bun.lock` with `package.json`. The lockfile fixes dependency versions;
`trustedDependencies: []` and `--ignore-scripts` disable dependency install
scripts. Bun still uses packages from the npm registry, so review dependency
updates. The original standalone Tailwind build remains available through
`sh scripts/build.sh` when project dependencies are absent.

## Files

- `public/index.html`: the only HTML page and the content you edit.
- `src/styles.css`: Tailwind import and editable site behavior.
- `public/styles.css`: generated output, ignored by Git; do not edit it directly.
- `public/assets/`: future images, icons, fonts, and résumé PDF.
- `scripts/build.sh`: invokes the Tailwind CLI in build or watch mode.
- `wrangler.jsonc`: static hosting and custom-domain configuration.

Only `public/` is published. `.assetsignore` excludes local metadata and empty
directory placeholders. `teddyg.dev` is the canonical hostname; requests for
`www.teddyg.dev` redirect there. `workers.dev` and version preview URLs are
disabled in the configuration.

## Deploy to Cloudflare

Use **Workers Static Assets** on the Free plan. Static asset requests are free
and unlimited; this project has no Worker application code or home server.
([Cloudflare pricing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/))

### 1. Enable DNSSEC after the zone is Active

1. Open **teddyg.dev → DNS → Settings → DNSSEC** in Cloudflare and enable DNSSEC.
2. Copy the displayed **Key Tag, Algorithm, Digest Type, and Digest**.
3. In Porkbun, open **Domain Management → teddyg.dev → Details → Registry DNSSEC
   → Edit**. Create a record using those four values in **dsData**. Leave
   **keyData** empty. This is the registry record for Cloudflare's DNSSEC.
4. Wait for Cloudflare to report DNSSEC **Active**. Leave the Cloudflare
   nameservers in place at Porkbun.

Official instructions: [Cloudflare](https://developers.cloudflare.com/dns/dnssec/)
and [Porkbun](https://kb.porkbun.com/article/93-how-to-install-dnssec).

### 2. Publish the first version

From this repository's root:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run deploy:check
bun run login
bun run deploy
```

The check builds and validates without publishing. Login opens Cloudflare's
browser authorization flow; choose the account containing `teddyg.dev`. Deploy
builds the CSS, uploads the site, and connects the custom domain. Cloudflare
creates the domain's DNS record and HTTPS certificate automatically. No home
IP address or manually created A record is needed.

If Cloudflare reports an existing DNS record conflict, inspect **DNS → Records**
and remove only obsolete parking/forwarding A, AAAA, or CNAME records at `@`
(`teddyg.dev`), then retry. Preserve records used for other services.
([Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/))

In **Workers & Pages → teddyg-portfolio → Settings → Domains & Routes**, wait
for `teddyg.dev` and its certificate to become active. Open
**https://teddyg.dev** on another device, including a phone on mobile data.
Check the layout and CSS. This setup serves the apex domain; `www.teddyg.dev`
is redirected to it. Subsequent manual updates need just `bun run deploy`.

### 2a. Redirect `www` to the apex domain

Create this DNS record in **Cloudflare → DNS → Records**:

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| A | `www` | `192.0.2.1` | Proxied |

The address is a reserved placeholder; Cloudflare handles the request before
anything reaches it. Then open **Rules → Overview → Create rule → Redirect Rule**
and configure:

| Setting | Value |
| --- | --- |
| Request URL | `https://www.teddyg.dev/*` |
| Target URL | `https://teddyg.dev/${1}` |
| Status code | `301` |
| Preserve query string | Enabled |

Deploy the rule. For example, `/projects?from=www` becomes
`https://teddyg.dev/projects?from=www`. Cloudflare requires the `www` record to
be proxied for a Single Redirect to run. ([Redirect documentation](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/))

### 3. Deploy automatically when pushing to GitHub

Commit and push these project changes, including `bun.lock`, to
`teddyg26/portfolio-web`. Then open the existing **teddyg-portfolio** Worker,
go to **Settings → Build**, and connect that GitHub repository. Use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `bun install --frozen-lockfile --ignore-scripts && bun run build` |
| Deploy command | `bun run deploy` |
| Preview/non-production builds | Disabled |
| Build variable `BUN_VERSION` | `1.4.2` |
| Build variable `NODE_VERSION` | `24` |
| Build variable `SKIP_DEPENDENCY_INSTALL` | `1` |

Set these under **Build Variables and Secrets**, and use Cloudflare's generated
deployment token. After saving, each push to `main` builds and publishes the
website. Check the build log for success, then refresh `https://teddyg.dev`.
The Free plan includes 3,000 build minutes per month. Manual deployments remain
available if that allowance is exhausted.

References: [Build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/),
[Bun/version and install controls](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/),
[build allowance](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).

### 4. Enable free bot protection

In the `teddyg.dev` zone, open **Security → Settings**, filter by **Bot traffic**,
and enable **Bot Fight Mode**. Test the site again from your other devices.
Bot protection reduces automated access; publish only information you intend to
make public. ([Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/))

## Add your content

TODO comments in the HTML mark unfinished content. Placeholder text and dashed
asset slots are intentional; no photos, logos, fonts, project claims, or personal
contact details have been invented.

For each project:

1. Replace the title and description with your content.
2. Add the repository URL to the title link and the GitHub Repo button. Keep
   picture previews inside a non-interactive `.project-preview` container.
3. Replace the preview slot with an `img` whose `src` points into `./assets/`.
   Supply descriptive `alt`, actual `width` and `height`, and `loading="lazy"` for
   previews below the initial viewport.

The Wolfenstein preview has a full-area play/pause button: hovering or focusing
it darkens the video and reveals a circular Lucide icon. On touch devices the
icon appears after each tap, stays for one second, then fades away. Video sources
load near the viewport; playback starts on
any viewport intersection and pauses when completely outside it or in a hidden
tab. Manual pauses persist, and reduced-motion visitors see the static poster
until they choose Play. The image previews are not links.

Repository buttons follow the active palette and have lightly rounded corners.
Links and controls have visible focus outlines. Anchors without URLs are deliberately inactive rather than linking to
`#` or fabricated destinations. Duplicate a project article and give its heading
a unique ID to add another entry; keep `aria-labelledby` in sync. The wide layout
alternates image placement automatically, while the narrow layout always puts
the preview before the description.

Add your résumé as `public/assets/resume.pdf`, then add
`href="./assets/resume.pdf"` and `download` to the résumé anchor, remove
`aria-disabled`, and delete the placeholder note. The résumé block stays at the
end of Projects, immediately above Contact.

Add your email and social-profile URLs to the footer and remove `aria-disabled`
from the completed links. When replacing the GitHub and LinkedIn text with your
chosen SVG logos, retain the links' accessible labels and use `currentColor` to
follow the eventual palette.

## Appearance

The site uses [Catppuccin](https://catppuccin.com/palette/) Frappé for dark mode
and Latte for light mode, with neutral surfaces and text to maintain a muted
appearance. JetBrains Mono is self-hosted. The hero fills the initial viewport
below the sticky navbar.

Without a saved choice, the site follows `prefers-color-scheme`, with Frappé as
the fallback. The Theme button beside Home switches between Frappé and Latte;
`portfolio-theme` in local storage remembers the choice across visits and tabs.
Clearing that entry restores system preference tracking. Storage restrictions
do not prevent toggling for the current visit. With JavaScript disabled, system
preferences still work and the toggle stays hidden.

The `color-scheme` property matches the active palette. Dark Reader remains free
to apply the visitor's settings; its **Detect dark theme** option can leave the
native dark palette untouched. No extension-specific overrides or locks are
injected. Actual extension behavior depends on its mode and settings.

Reduced-motion settings disable the typewriter and cursor animations, smooth
scrolling, and image/icon transitions. Run `bun test` for theme preference tests.
