# TheIOGames

**Appropriate, Free & Fun for All Ages!** A self-contained browser arcade with 59 built-in games.

## The deliverable: `index.html`

`index.html` in the repository root is the complete website. It is one file (about 0.8 MB) that holds all the HTML, CSS, JavaScript, game logic, graphics (Canvas and CSS drawing) and sound (synthesised with Web Audio). It loads nothing from the internet: no libraries, fonts, images, CDNs or embeds. To publish it, upload that single file to Netlify or any static host.

The other folders are only for development. You don't need them to publish:

| Path | What it is |
|---|---|
| `src/head.html`, `src/core.js`, `src/games/*.js`, `src/boot.js` | Source parts that are joined into `index.html` |
| `tools/build.sh` | Rebuilds `index.html` from `src/` and checks the JavaScript syntax |
| `tools/smoke.js`, `tools/shot.js` | Playwright scripts for automated testing and screenshots |
| `backup/Index.original.html`, `Index.html.html` | Your original site, kept untouched |

## Games (59)

* **The 5 original games are kept as they were:** Hole.io, Farmer.io, Chicken.io, Snake.io, Cells
* **The 43 core games:** Bottle Jump 3D, Basketball Challenge, Perfect Stack, Tower Balance, Target Toss, Mini Golf, Pool 8-Ball, Bowling, Slope Runner, Geometry Rush, Color Switch, Flappy Challenge, Subway Escape, Space Shooter, Brick Breaker, Asteroid Field, 2048, Parking Jam, Block Puzzle, Sudoku, Math Swap, Paper Territory, The Impossible Quiz, Word Scramble, Reaction Test, Whack-a-Mole, Piano Tiles, Clicker Empire, Reflex Challenge, Aim Trainer, Soccer Penalties, Tennis Challenge, Table Tennis, Skateboard Tricks, Car Stunt Challenge, Hole Arena, Slither Arena, Build a Bridge, Fishing Frenzy, Creature Evolution, Hotel Simulator, Pet Store Simulator, Hammer Climb Challenge
* **The 5 additional games:** Kart Clash, Style Studio, Pirate Royale, Sushi Snake, Brainrot Heist
* **The 5 newest games:** Roll Rush 3D (ball rolling on a floating, twisting track), Stack Smash 3D (smash down through spinning ring stacks), Bottle Flip, Flappy Jump, Shark.io

### 🔥 Hottest Games Right Now

The homepage opens with a hexagon “Hottest Games Right Now” section. To change it, edit the `HOTTEST` list of game ids in `src/core.js` (just above `const CATS`) and rebuild with `./tools/build.sh`. Every game tile is a hexagon with its own generated thumbnail (the painters are in `src/games/99_thumbs.js`).
* **One extra game:** Two Player Adventure, the co-op game from the 2-player list

**Local 2-player modes (same device, two humans):** Basketball Challenge, Pool 8-Ball, Table Tennis, Two Player Adventure, Soccer Penalties, Bowling, Slither Arena, Mini Golf, Reaction Test. Each of these opens with a 1 PLAYER / 2 PLAYERS choice. The single-player modes are still there.

## Site features

* Homepage sections:
  * featured carousel
  * Trending, Most Popular, New, 2-Player, Recently Played and Favorites
  * an All Games grid with category filters (Physics, Arcade, Endless, Puzzle, Brain Games, Sports, Multiplayer, Simulation, Creative, Popular and IO Arena)
* Live search by game name, category or description
* High scores and coins
* 38 achievements and 3 daily challenges a day
* A Rewards shop where coins buy site colour themes
* Statistics for each game, and favorites
* **3-minute pet reward:** a timer counts only while you are actively playing. It pauses when the game is paused, a menu or chooser is open, or the tab is hidden, and it carries over when you switch games. Each 3 minutes unlocks a random pet you don't already own, so duplicates can't happen. There are 33 original pets in 6 rarities, shown with an unlock animation and in MY PET COLLECTION.
* **Saving:** everything is stored in `localStorage` on the current device only. The site explains on the homepage that progress doesn't sync across devices.

## QA checklist

What was actually checked, in headless Chromium (Playwright):

- [x] Every game opens, accepts mouse, keyboard and touch input, pauses, resumes, restarts and exits back to the menu with no JavaScript errors.
  - This ran in two setups: desktop at 1280×800, and touch-emulated tablet at 1024×768 and 820×1180.
- [x] All 9 two-player modes start and run with no errors.
- [x] Gameplay spot checks:
  - **Bottle Jump:** bottles land upright.
  - **Brainrot Heist:** buy → carry home → creature earns money.
  - **Build a Bridge:** the car crosses a real truss.
  - **Car Stunt:** an automated driver finishes all 3 tracks, loops included.
  - **Tower Balance:** stacked pieces stay at rest.
  - **Bowling:** scoring is unit-tested (300, 0, 150 and a mixed game).
  - **Pool:** break, physics and AI turns.
  - **Table Tennis:** AI rallies.
  - **Pet reward:** fires once at 3:00, the timer stops while paused, and no duplicate pets are given.
  - **Homepage:** search and category filters work.
- [x] The HTML tag structure balances, there are no duplicate IDs, and the file has no external URLs.

Not verified:

- [ ] **Real Safari, iPhone and iPad hardware.** Testing used Chromium with touch emulation only. The code sticks to widely supported APIs (Pointer Events, Canvas 2D, Web Audio with a `webkitAudioContext` fallback), but please do a quick check on a real iPad.
- [ ] Every level was not played to completion by a human. Two Player Adventure's 5 levels and the later Mini Golf and Bridge levels were checked by design (jump heights, budgets) but not fully played through.

## Rebuilding

```bash
./tools/build.sh            # writes index.html and syntax-checks it
node tools/smoke.js         # opens every game and reports JS errors (add --mobile or --p2)
```
