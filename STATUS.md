# Mechanical Mechanisms — Project Status

The project is a zero-dependency HTML/Canvas simulator for four mechanisms, with English and Bulgarian UI, themes, playback controls, adjustable parameters, traces, and a responsive sidebar.

## Entry points and assets

- `index.html` — primary page, loads `app.js`.
- `app.js` — mechanism simulation, animation, controls, and UI logic.
- `NEW_and_inpruved_site_for_Atanas1.html` — synchronized page copy that also uses adjacent `app.js`.
- `fourbar.jpg`, `geneva.jpg`, `scotch-yoke-mechanism-2.png`, `sungear.jpg` — reference images.

## Current status

The original startup blockers are fixed. The planetary sun gear and planets now rotate according to the fixed-ring gear relation with matching tooth modules. Geneva now defaults to the four-stop design shown in its reference image and uses an engagement/dwell motion cycle. The local launch server serves `app.js` with a JavaScript MIME type.
