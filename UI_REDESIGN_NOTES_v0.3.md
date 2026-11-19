# MlimaniFleet UI refresh — v0.3

## Visual changes
- Added an original, high-resolution fleet showcase image featuring a heavy truck, passenger coach, sedan and SUV.
- Added a dashboard hero panel with fleet-focused messaging and photographic background.
- Added three image-led vehicle category cards for trucks, buses/coaches and cars/utility vehicles.
- Refreshed typography hierarchy using DM Sans and Manrope.
- Introduced a premium navy, teal and blue palette, subtle page gradients, glass-like top bar, richer shadows, rounded panels and clearer hover/focus states.
- Improved mobile stacking for the new hero and vehicle category cards.
- Updated the login/register screen to use the fleet image and matching gradient button styling.

## Files changed
- `apps/web/public/fleet-showcase.png` (new image asset)
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/AuthGate.tsx`

## Validation
- `App.tsx` and `AuthGate.tsx` pass TypeScript transpilation syntax checks.
- A complete Vite production build and browser/device visual QA have not been run in this environment because project dependencies are not installed here.
- Image is served locally by the web app from `/fleet-showcase.png`; it does not rely on a third-party image host.
