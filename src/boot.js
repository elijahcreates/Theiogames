
/* =====================================================================
   BOOT – metadata for the original 5 games, then render
   ===================================================================== */
const LEGACY_META = {
  hole: { cats: ['IO Arena', 'Arcade', 'Creative'], input: 'joy', pop: true, legacy: true },
  farm: { cats: ['Simulation', 'IO Arena'], input: 'joy', legacy: true },
  chicken: { cats: ['IO Arena', 'Arcade'], input: 'joy', legacy: true },
  snake: { cats: ['IO Arena', 'Arcade'], input: 'joy', pop: true, legacy: true },
  cells: { cats: ['IO Arena', 'Arcade'], input: 'joy', legacy: true }
};
GAMES.forEach(g => { if (LEGACY_META[g.id]) Object.assign(g, LEGACY_META[g.id]); if (!g.input) g.input = 'ptr'; if (!g.cats) g.cats = []; });
const ORDER = ["brainrot", "bottle", "kart", "pirate", "sushi", "style", "hammer", "hotel", "petstore", "coop", "subway", "slope", "basketball", "pool", "minigolf", "bowling", "penalty", "tabletennis", "tennis", "stack", "geometry", "colorswitch", "flappy", "shooter", "brick", "asteroid", "reflex", "slither", "holearena", "paper", "evolution", "fishing", "clicker", "carstunt", "skate", "tower", "bridge", "targettoss", "g2048", "blockpuzzle", "parking", "sudoku", "mathswap", "quiz", "wordscramble", "reaction", "whack", "piano", "aim", "hole", "farm", "chicken", "snake", "cells"];
GAMES.sort((a, b) => { const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
window.TheIOGames = { registerGame, engine: E, games: GAMES };
renderMenu();
route();
})();
</script>
</body>
</html>
