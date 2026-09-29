# Portfolio website

## Local use

The build uses the standalone `tailwindcss` executable on your PATH. The initial
boilerplate was built with Homebrew's Tailwind CSS 4.3.3. Homebrew controls the
installed version; there is no separate compiler download in this repository.

```sh
brew install tailwindcss
sh scripts/build.sh
```

Open `public/index.html` directly in a browser after building. No server is needed
for this boilerplate. To rebuild CSS while editing:

```sh
sh scripts/build.sh --watch
```

Refresh the browser after changes. Stop watch mode with Ctrl-C. Run the regular
build again to produce minified CSS. Rebuild after changing HTML utility classes
as well as after editing the source CSS.

## Files

- `public/index.html`: the only HTML page and the content you edit.
- `src/styles.css`: Tailwind import and editable site behavior.
- `public/styles.css`: generated output, ignored by Git; do not edit it directly.
- `public/assets/`: future images, icons, fonts, and résumé PDF.
- `scripts/build.sh`: invokes the installed CLI in build or watch mode.

Only `public/` is intended for eventual publishing. Hosting is not configured.
When adding deployment automation, use the same explicit compiler version locally
and in the build environment.

## Add your content

TODO comments in the HTML mark unfinished content. Placeholder text and dashed
asset slots are intentional; no photos, logos, fonts, project claims, or personal
contact details have been invented.

For each project:

1. Replace the title and description with your content.
2. Add the same repository URL as `href` on the preview and title anchors, then
   remove their `aria-disabled` attributes and the repository placeholder text.
3. Replace the preview slot with an `img` whose `src` points into `./assets/`.
   Supply descriptive `alt`, actual `width` and `height`, and `loading="lazy"` for
   previews below the initial viewport. Update the preview link's `aria-label`
   to identify the project and destination.

Linked images dim on hover and keyboard focus. Links also have visible focus
outlines. Anchors without URLs are deliberately inactive rather than linking to
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

The full-width introduction uses deep charcoal with white text and fills the
initial viewport below the sticky navbar. The full-width footer retains a gray
background; its content aligns with the rest of the page. The résumé remains
inside Projects without divider lines. The remaining content uses browser
canvas/text colors, system fonts, and Tailwind blue for interactive states.
Reduced-motion settings disable smooth scrolling and image transitions.
