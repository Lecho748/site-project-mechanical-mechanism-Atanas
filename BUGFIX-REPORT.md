# Mechanical Mechanisms — Fix Notes

## Project entry points

- `index.html` is the primary page and loads `app.js` for mechanism logic and controls.
- `NEW_and_inpruved_site_for_Atanas1.html` is a synchronized copy of the page and also requires adjacent `app.js`.
- The JPG and PNG files are visual reference assets.

## Fixes made

- Repaired the unclosed HTML/script and JavaScript parse errors that stopped the simulator from starting.
- Fixed the sidebar and overlay ID lookups, strict-mode errors, and the collapsed sidebar sizing.
- Corrected the planetary gear train so the sun gear spins, planets turn at the fixed-ring epicyclic rate, and teeth use matching pitch modules.
- Rebuilt the Geneva mechanism as a four-stop Maltese cross based on `geneva.jpg`, with the crank pin driving the wheel through a defined engagement interval and a dwell between steps.
- Improved language-specific labels, speed readout, and local JavaScript MIME handling.

## Known limits

- Joint dragging, touch interaction with the canvas, and image export are not implemented.
