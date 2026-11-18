import os
SC = {
 '01-sunflower-phyllotaxis': ('Sunflower · Phyllotaxis', "  density: 1.0,     // number of seeds\n  growth: 6,        // new seeds per second\n"),
 '02-fern-ifs': ('Fern · Iterated Function System', "  density: 1.0,     // points per frame (detail vs. CPU)\n"),
 '03-geodesic-dome': ('Geodesic Dome', "  frequency: 4,     // subdivision of the icosahedron (2–6)\n"),
 '04-ocean-waves': ('Moonlit Ocean · Deep-Water Waves', "  density: 1.0,     // number of wave lines\n"),
 '05-wind-flow': ('Wind · Incompressible Flow', "  density: 1.0,     // number of tracers\n  speed: 1.0,       // wind speed\n"),
 '06-kepler-orrery': ('Orrery · Kepler Orbits', "  yearSeconds: 20,  // seconds per Earth year\n"),
 '07-dna-helix': ('DNA · Double Helix', ""),
 '08-lorenz-attractor': ('Lorenz Attractor · Chaos', "  speed: 0.55,      // simulation time units per second\n  resetEvery: 75,   // seconds before the twin trajectory is re-seeded\n"),
 '09-harmonograph': ('Harmonograph · Musical Intervals', "  intervalSeconds: 24, // seconds per musical interval\n"),
 '10-topographic-map': ('Topographic Map · Contours', "  drift: 0.012,     // how fast the terrain morphs\n"),
 '11-crystal-lattice': ('Crystal Lattice · Rock Salt', "  size: 2,          // ions per side = 2·size + 1\n"),
 '12-taxicab-city': ('City Grid · Taxicab Geometry', ""),
 '13-mountain-ridges': ('Mountain Ridges · Fractal Terrain', "  speed: 1.0,       // drift speed of the ridges\n"),
 '14-neural-network': ('Neural Network · Live Training', "  retrainEvery: 75, // seconds before the network starts learning again\n"),
 '15-rain-ripples': ('Rain Ripples · Wave Equation', "  rain: 1.0,        // rainfall rate\n"),
 '16-spiral-galaxy': ('Spiral Galaxy · Density Waves', "  density: 1.0,     // number of stars\n"),
 '17-electric-field': ('Electric Field · Point Charges', "  lines: 18,        // field lines per positive charge\n"),
 '18-pendulum-wave': ('Pendulum Wave', ""),
 '19-gear-train': ('Gear Train · Spur Gears', "  speed: 1.0,       // driver gear speed\n"),
 '20-chladni-plate': ('Chladni Plate · Vibrating Sand', "  density: 1.0,     // amount of sand\n  modeSeconds: 14,  // seconds per vibration mode\n"),
 '21-aurora-lake': ('Aurora over a Mountain Lake', ""),
 '22-fractal-forest': ('Fractal Forest · Fireflies', ""),
 '23-desert-dunes': ('Desert Dunes · Caravan', ""),
 '24-coral-reef': ('Coral Reef · Fish School', ""),
 '25-snowfall-pines': ('Snowfall in the Pines', ""),
 '26-river-village': ('River Village at Dawn', ""),
 '27-gothic-cathedral': ('Gothic Cathedral · Elevation', ""),
 '28-city-bridge': ('City Night · Suspension Bridge', ""),
 '29-mosque-geometry': ('Mosque · Eight-fold Geometry', ""),
 '30-lighthouse-coast': ('Lighthouse · Coastal Village', ""),
 '31-desert-world': ('Desert World · Two Suns', ""),
 '32-golden-erg': ('Golden Erg · Realistic', "  palette: 'warm',  // 'warm' sand colours or 'grey'\n  speed: 1.0,       // how fast the camera drifts over the dunes\n"),
 '33-moonlit-desert': ('Moonlit Desert · Realistic', "  palette: 'warm',  // 'warm' sand colours or 'grey'\n  speed: 1.0,       // how fast the camera drifts\n"),
 '34-twin-sun-storm': ('Twin Suns & Storm · Realistic', "  palette: 'warm',  // 'warm' sand colours or 'grey'\n  speed: 1.0,       // how fast the camera drifts\n"),
}
common = open('common.js').read()
terrain_src = open('terrain.js').read()
os.makedirs('out', exist_ok=True)
for key,(title,extra) in SC.items():
    if not os.path.exists(f'scenes/{key}.js'): continue
    scene = open(f'scenes/{key}.js').read()
    terrain = terrain_src if key[:2] in ('32','33','34') else ''
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<!--
  {title} — live wallpaper for Lively Wallpaper (grey · mathematical series)
  Add it in Lively: click "+" → choose this file.
  Change the SETTINGS block below with Notepad, save, then re-add in Lively.
-->
<style>
  html, body {{ margin: 0; height: 100%; background: #000; overflow: hidden; }}
  canvas {{ position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; }}
</style>
</head>
<body>
<canvas id="base"></canvas>
<canvas id="over"></canvas>
<script>
// ===================== SETTINGS =====================
const SETTINGS = {{
  theme: '{"warm" if key[:2] in ("32","33","34") else "grey"}',    // 'grey' | 'warm' | 'green' | 'ice' | 'amber'
  math: {"false" if key[:2] in ("32","33","34") else "true"},       // equations, labels and readouts (false = clean version)
  parallax: true,   // gentle shift with the mouse
  fps: 30,          // frame cap; 30 keeps the GPU/CPU load low
{extra}}};
// ====================================================

{scene}
{terrain}
{common}
</script>
</body>
</html>
'''
    open(f'out/{key}.html','w').write(html)
