# 3D_Earth
🌍 Interactive 3D Earth Globe

An interactive 3D globe built with React, TypeScript, Three.js, TopoJSON, and d3-geo.

The project displays a textured Earth with country boundaries and allows users to rotate, zoom, hover over countries, and view country information.

✨ Features
🌎 Interactive 3D Earth
🗺️ Country borders based on Natural Earth / World Atlas data
🖱️ Mouse drag to rotate the globe
🔍 Scroll to zoom in and out
📱 Touch-friendly interaction
✨ Country hover highlighting
🏷️ Country name tooltip
🖱️ Click a country to view details
🏳️ Country flag display
🏛️ Capital information
👥 Population information
🌍 Region information
🌐 Country data loaded from the REST Countries API
⭐ Responsive full-screen design
⚡ Optimized Three.js rendering
🛠️ Technologies
React
TypeScript
Three.js
TopoJSON
d3-geo
Vite
REST Countries API

Modular Interactive Earth Globe

Split from the working InteractiveEarthGlobe.tsx into focused modules.

Files

constants.ts — URLs and globe/camera constants

types.ts — shared TypeScript types

coordinates.ts — geographic ↔ 3D coordinate conversion

CountryBorders.ts — TopoJSON loading and border geometry

CountryDetection.ts — raycasting and d3-geo country detection

CountryData.ts — REST Countries API

GlobeControls.ts — OrbitControls configuration

GlobeScene.ts — Three.js scene, Earth, atmosphere, stars, cleanup

GlobeUI.tsx — React UI/tooltip/country panel

InteractiveEarthGlobe.tsx — main React component

Install

npm install three topojson-client d3-geo
npm install -D @types/three @types/geojson @types/d3-geo

Keep these files in your existing project:

public/earth.jpg
public/countries-110m.json

Then import:

import InteractiveEarthGlobe from "./components/globe/InteractiveEarthGlobe";

![alt text](image.png)