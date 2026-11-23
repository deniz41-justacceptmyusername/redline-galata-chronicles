# REDLINE — Galata Chronicles

A bilingual top-down crime story and drift-driving game set on the irregular streets of Galata and Karaköy, Istanbul. Play as Polat, a courier whose family is threatened by a mafia network, and follow his relationship with Elif through 18 chapters.

**English / Türkçe · Browser / Canvas 2D · MIT game code · ODbL map data**

## 3.1 city repair

Roads render with shared curb, gutter and asphalt passes, keeping junctions continuous. Duplicate OSM edges are removed. Footways and steps stay narrow and do not stripe vehicle lanes. Pedestrian streets work as connected arcade alleys, vehicle clearance is wider, and cover follows street direction.

For browser geometry checks, open **/city-check.html** on the development server. It validates 1,560 junction pixels and includes five neighborhood views.

## Play

Open **REDLINE.html** in a modern browser. The portable build includes the map, code, styles and translations. No installation, server, account or internet connection is required.

Choose **REAL GALATA** for OpenStreetMap road and building geometry. **FICTIONAL ISTANBUL** preserves the larger four-district arcade map and its paid district licenses. Map bounds remain finite; the real-city layout is irregular, with a coastline and winding streets. Some road widths are adjusted for driving clearance. Interiors, venues, characters, encounters and rooftop details are fictional.

Saves are local to the browser. Keep the same browser and file location when replacing an older portable build. Chapter progress, money, unlocked weapons and ammunition persist; an unfinished encounter restarts from its chapter.

## Features

- **Four modes:** Story, Chase, Endless Chaos and Free Drive.
- **18 story chapters:** original bilingual dialogue, 11 characters, restaurant defense, warehouse encounters, chases, choices about trust, Elif dream sequences and two ending states.
- **Street jobs:** repeatable food delivery, courier work, passenger transport and spare-parts delivery.
- **On-foot play:** leave and enter cars, take a civilian vehicle, aim, fire, sprint, dodge and visit nine indoor venues.
- **Six weapons:** pistol, revolver, SMG, shotgun, carbine and marksman rifle. Purchase weapons and ammunition with earned money; some chapters unlock weapons.
- **Forgiving health:** 200 player health, two medkits per run, regeneration after 5.5 seconds without a hit, furniture and walls that block bullets.
- **Police and SWAT:** cars pursue the player; nearby crews dismount when Polat is on foot. Four/five stars bring armored SWAT with SMGs/carbines. Police can breach interiors.
- **Escapable helicopters:** clear-road speed and nitro can break contact; roofed passages and indoor venues block aerial sight. Ground units can keep searching or enter the building.
- **12 cars:** classics, a compact street car, van, minibus, off-roader, supercar and armored sedan. Engine, handling, armor and nitro upgrades are per car.
- **Manual rear-window defense:** hold Q to fire behind the car. The old roof turret is replaced. Tire-puncturing mines and oil slicks remain purchasable.
- **Street life:** pedestrians, civilian braking and turn navigation, traffic lights, weathered polygon rooftops, water tanks, air conditioners, antennas, laundry, tea tables and awnings.
- **Presentation:** day/night lighting, synthesized audio, optional radio, minimap, navigation, gamepad and touch controls.

## Controls

| Action | Keyboard / mouse |
| --- | --- |
| Drive / walk | WASD or arrow keys |
| Enter / exit vehicle | F |
| Handbrake / dodge on foot | Space |
| Nitro / sprint on foot | Shift |
| Enter venue / talk / service | E |
| Aim / fire on foot | Mouse / left click; J supports automatic enemy aiming |
| Select weapon | 1–6 |
| Reload on foot | R |
| Medkit | B |
| Story journal / jobs | H |
| Weapon shop | O |
| Manual rear-window fire | Hold Q |
| Tire mine / oil | Z / C |
| City map / owned safehouse route | M / G |
| Return a stuck car to the road | R in vehicle; costs body health |
| Pause | Escape or P |

Gamepad: left stick moves/steers, RT gas/fire, LT brake, A drift, B boost/sprint, Y enter/exit, X interact, LB mine, RB oil, right stick aims on foot, Start pauses. On-screen buttons support touch. Keyboard/mouse is recommended for combat.

## Pursuits and money

Normal pursuits end after 20–28 seconds out of sight, according to wanted level. Remaining nearby officers can maintain contact. Reach an owned safehouse after escape to finish a run with a bonus.

Endless Chaos continuously replenishes up to 4/6/8/11/14 pursuing vehicles at 1–5 stars. It cannot be escaped or ended through a safehouse; finish from Pause to collect run earnings. Free Drive has no police.

Chapter rewards and completed delivery jobs pay into the wallet immediately. Driving rewards are collected when a run ends. Spend the wallet on vehicles, upgrades, ammunition, repair/nitro services and, on the fictional map, districts and safehouses.

## Development

Node.js 20+; no npm dependencies.

~~~sh
npm run dev
npm test
npm run build
~~~

Open http://127.0.0.1:4173 for development. The build validates bundled JavaScript and writes **REDLINE.html** and **dist/REDLINE-Offline.html**.

The automated suite covers driving, collision chains, traffic queues/signals, pursuit difficulty, helicopter cover and escape, real-road route clearance, save migration, health, weapons, purchases, SWAT, chapter progression, jobs and finite Canvas rendering commands. Browser visual/input verification remains a separate manual check.

| Source | Responsibility |
| --- | --- |
| dist/world.js, city-roads.js, real-world.js, istanbul-data.js | Fictional/real geometry, road graph, collision clearance |
| dist/physics.js, traffic.js | Vehicle handling and civilian navigation |
| dist/pursuit.js | Dispatch, search and helicopters |
| dist/human.js, combat.js | Pedestrians, on-foot movement, weapons, interiors and police crews |
| dist/story.js | Characters, chapters, dialogue, choices and jobs |
| dist/equipment.js, progression.js | Equipment, purchases, upgrades and profile migration |
| dist/render.js, render-v3.js | Canvas rendering, streets and rooftops |
| dist/i18n.js, main.js, audio.js | Language, UI/input/persistence and synthesized sound |
| scripts/build.mjs, tests/ | Offline build and regression checks |

## Map data and licensing

The Galata–Karaköy dataset contains 1,037 road/path polylines and 3,304 building polygons derived from **© OpenStreetMap contributors**. It is packaged in **dist/istanbul-data.js** under the **Open Database License 1.0**. See [MAP-DATA-LICENSE.md](MAP-DATA-LICENSE.md), [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) and [ODbL](https://opendatacommons.org/licenses/odbl/1-0/).

Game code, original story and procedural graphics are licensed under [MIT](LICENSE). The MIT license does not replace the map database’s ODbL license. This project is an original game and has no affiliation with Rockstar Games or Google Maps.
