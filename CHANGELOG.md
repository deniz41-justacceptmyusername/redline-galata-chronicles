# Changelog

## 3.1.0 — Street layout repair

- Render curbs, gutters and asphalt in shared passes so crossing streets form one continuous surface.
- Remove duplicate OpenStreetMap edges and simplify bends while retaining junctions.
- Render footways and steps as narrow paths, clipped outside buildings and carriageways.
- Connect pedestrian streets as driveable arcade alleys and give vehicles more street clearance.
- Align the starting vehicle and covered passages with street direction.
- Reduce repeated street-name labels and clean up the minimap.
- Preserve the story, vehicles, weapons, upgrades and existing profile format.

Validation: 57 automated tests pass. The browser junction check validates 1,560 Canvas pixels. Four neighborhood views and a starting-street driving check were inspected during development.
