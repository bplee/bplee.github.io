# wander

`index.html` — the owl & mouse intro dialogue, links to the world.
`world.html` — the walkable world. Just markup; all logic lives in `js/`.

Scripts are plain (non-module) `<script>` tags sharing globals, loaded in this order:

| file | what's in it |
| --- | --- |
| `js/core.js` | canvas, terrain / `groundY`, court constants, objects list, input + `tryJump`, camera, `showHint`, `fadeTransition`, current `scene` |
| `js/scenery.js` | sky, stars, moon, parallax hills/trees, terrain, log/rollerblades/letter, proximity popups |
| `js/critters.js` | `drawCritter(x, y, kind, opts)` — line-art animals (no emoji) |
| `js/player.js` | player state, `drawPlayer` + worn items, `updatePlayer`, one-way platforms (`platformCollide`) |
| `js/inventory.js` | bag · friends · quests: `give()`, `wearing()`, `meet()`, `startQuest()`; item icons + portraits (`renderToURL`), side panel (I / J), worn strip |
| `js/weather.js` | random weather (`?weather=snow` to force, **R** to reroll), particles, clouds, fog, lightning, window views |
| `js/woods.js` | home burrow, signpost, big swaying trees + swing, pond, bouncy mushrooms, fireflies, grass, dust, owl flyby |
| `js/volleyball.js` | the court (lights, scoreboard, bench), first-to-5 game, clover / ember / burr |
| `js/tavern.js` | the dozy gecko: exterior, ground floor, stairs + balcony geometry, regulars, drinks |
| `js/tavern_balcony.js` | balcony residents: nana fern + yarn, lumen, dusk, rooms 1–3, nap, rosco's button |
| `js/observatory.js` | the hill (part of `groundY`, via `hillH`), observatory, nova, telescope sky + constellations |
| `js/cavern.js` | cave mouth + digging, the cavern scene (tunnel → chamber → pool), swimming, ledges, glowstone |
| `js/touch.js` | phones/tablets: pop-up joystick (right), tap-to-jump (left), action button, telescope drag, rotate card — sends the same key events as the keyboard |
| `js/main.js` | `update()` / `draw()` per scene, fixed 60Hz loop, init |

`css/world.css` — HUD styles (hint pill, score, weather/drink label).

Scenes: `scene` is `'outside'`, `'tavern'` or `'cavern'`. `floorAt(x)` / `platformY(x)` in `player.js`
pick the floor and one-way platforms (tavern balcony + stairs, cavern ledges; ↓ drops through) per scene.
The camera has `camX` and `camY`; world drawing happens inside `ctx.translate(0, -camY)` in `main.js`,
sky layers stay in screen space.

Controls: arrows/WASD move, space jumps (again in the air to flip), E talks / uses, I bag, J friends.
On touch screens: joystick on the right half (pull down = ↓), tap the left half to jump, the yellow button = E.

Phones (`MOBILE` in `core.js`, i.e. `pointer: coarse`): the world is laid out at ≥560 game-px tall and scaled to
fit (`ZOOM`), drawn at device resolution (`DPR`), with canvas fonts scaled up and effects reduced (`QUALITY`).
On a computer all of that is off (ZOOM = DPR = QUALITY = 1).

Adding a new place: put its world-x constant + draw/update functions in a new `js/*.js`, add a
`<script>` tag before `main.js`, and call its functions from `update()` / `draw()` in `main.js`.
