# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page, print-ready **A4 newspaper layout** ("Giorno Della vacanza" / "Welcome To the Pizzo calabro"), written in Italian. There is no build system, package manager, linter or test suite — it is static HTML/CSS/JS served by Laragon.

- Local URL: https://mamunmia.test/pizmamun/ (Laragon virtual host; HTTPS is required because the camera feature uses `getUserMedia`)
- To "run" it: open the URL above (or `index.html` directly, though the camera won't work over `file://`).

## Architecture

Content lives in [index.html](index.html) (mostly inline-styled markup); there is no inline `<style>` or `<script>` block. Everything is local — no CDN or network dependency:

- **[assets/js/config.js](assets/js/config.js)**: project settings as globals, loaded in `<head>`. `website_title` sets `document.title` (the `<title>` in index.html is intentionally empty); `print_area_border = true` adds the `print-area-border` class to `.container` (red dotted outline, screen only — removed for `@media print` and in the html2canvas clone so it never reaches the PDF). New settings go here.
- **[assets/js/gseba_script.js](assets/js/gseba_script.js)**: date and PDF download. **[assets/js/camera.js](assets/js/camera.js)**: camera, crop and upload (see below). Both load at the end of `<body>`; jQuery is used for show/hide, native APIs for the rest.
- **[components/camera.html](components/camera.html)**: markup partial for the whole left-column image block (`.image-container`: `#imageInput`, `#cameraContainer`, `#cropperContainer` and the hero `#imageContainer`/`#finalImage`). `camera.js` `fetch`es it into the `#cameraMount` placeholder in index.html and only then calls `initCamera()` to attach handlers, so the site must be served over HTTP(S) (Laragon), not opened via `file://`. The hero image and camera/crop elements therefore do not exist in index.html itself.
- **[assets/css/gseba_style.css](assets/css/gseba_style.css)**: page layout (`.container` is fixed at 21cm × 29.7cm, `.header`, `.main-title`, `.content`, `.left-section`/`.right-section`), the `@media print` rules (`@page` A4, `.no-print`, forced background colours), and the `UnifrakturMaguntia` `@font-face` (`assets/fonts/`) used for the masthead.
- **[assets/css/camera.css](assets/css/camera.css)**: DSLR camera overlay UI (`#cameraContainer`, `.dslr-ui`, `#captureButton`, `.focus-ring`).
- **Vendored libs**: `assets/js/jquery.min.js` (3.7.1), `assets/js/cropper.min.js` + `assets/css/cropper.min.css` (Cropper.js 1.6.1).

### Image-replacement pipeline (the only real logic)

The left-column hero image `#finalImage` (inside `#imageContainer`) is swapped by a three-step flow, toggling visibility between three sibling containers:

1. **Source**: either the `#cameraButton` ("Camera") → live `getUserMedia` stream in `#cameraContainer` (with zoom / exposure / torch sliders driven by `track.getCapabilities()`), captured to a canvas via `#captureButton`; or `#uploadButton` ("Pizzo calabro") → hidden `#imageInput` file picker read via `FileReader`.
2. **Crop**: `openCropper(src)` shows `#cropperContainer` with Cropper.js locked to aspect ratio **450/500**. Its `ready` callback **auto-clicks `#cropDone` after 1.2 s**, so the crop is effectively automatic.
3. **Apply**: `#cropDone` renders a 450×500 JPEG data URL into `#finalImage` (displayed 100% × 400px, `object-fit: fill`).

The 450/500 ratio is duplicated in the camera container CSS (`aspect-ratio`), `openCropper`, and the `cropDone` handler — change all three together. "Close" in the camera UI simply calls `location.reload()`.

### PDF download

Clicking **Device Memory** (`#downloadButton`) rasterises `.container` with html2canvas (scale 3, `.no-print` elements ignored) and saves it with jsPDF as a single **A4 portrait (210 × 297 mm)** page. The project is A4-only: never add other paper sizes or multi-page output; `.container` (21cm × 29.7cm) is the single source of truth for the page. Both libs are vendored in `assets/js/` (`html2canvas.min.js`, `jspdf.umd.min.js`, exposed as `window.jspdf`).

**Share** (`#shareButton`, in the green bar) builds the same PDF via the shared `buildPdf()` and hands it to `navigator.share({ files })` (Android Chrome over HTTPS; used to send the PDF to a Bluetooth printer app). Unsupported browsers get an alert.

After a successful save, the button text becomes "PDF Saved - Tap to Open" for `OPEN_PDF_SECONDS` (5 s); a click in that window opens the PDF blob in a new tab, otherwise it reverts to the original label and a click builds a new PDF. Files are named `newspaper-YYYY-MM-DD_HH-mm-ss.pdf` (local time).

### Print behaviour

Clicking the masthead title calls `window.print()`. Anything that shouldn't appear on paper needs the `no-print` class. Dark/coloured blocks rely on `print-color-adjust: exact`, and there is an attribute-selector hack (`div[style*="background:black"]`) that depends on inline style formatting. The layout must stay within one A4 page.

## Conventions

- Content is mostly inline-styled HTML with lots of commented-out leftover text (from earlier Rome/Napoli/Maradona versions of the newspaper). Text blocks are intentionally split mid-sentence across columns/floats, so edit copy carefully to keep the flow continuous.
- Code comments are a mix of English and Bengali; match the surrounding language when adding comments.
- All images are local in `assets/img/`.
