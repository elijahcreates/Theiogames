
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
// sponsored banner close button (hidden for the rest of this visit only)
(function () { const ad = document.getElementById('edgeAd'); if (!ad) return; try { if (sessionStorage.getItem('tiog_ad_hidden') === '1') ad.classList.add('hide'); } catch (e) {} const x = ad.querySelector('.ea-x'); if (x) x.addEventListener('click', () => { ad.classList.add('hide'); try { sessionStorage.setItem('tiog_ad_hidden', '1'); } catch (e) {} }); })();
renderMenu();
// intro splash: floating hexagon thumbnails + progress, then fade into the site
(function splash() {
  const sp = document.getElementById('splash'); if (!sp) return;
  const hx = sp.querySelector('.sp-hexes'), many = innerWidth > 700 ? 14 : 8, pool = shuffle(GAMES.slice()).slice(0, many);
  pool.forEach((g, i) => { const d = document.createElement('div'), sz = 50 + Math.random() * 70; d.className = 'h'; d.style.cssText = `left:${(i / many) * 100 + Math.random() * 4}%;width:${sz}px;height:${sz * 1.1547}px;background-image:url(${thumbURL(g)});animation-duration:${5 + Math.random() * 5}s;animation-delay:${-Math.random() * 5}s;--o:${0.35 + Math.random() * 0.4};--r:${(Math.random() - 0.5) * 120}deg;filter:blur(${sz < 70 ? 2 : 0}px)`; hx.appendChild(d); });
  const bar = sp.querySelector('.sp-bar i'), pct = sp.querySelector('.sp-pct'), tip = sp.querySelector('.sp-tip');
  const msgs = ['Warming up ' + GAMES.length + ' games…', 'Polishing the hexagons…', 'Waking up the pets…', 'Filling the coin jar…', 'Ready to play!'];
  const t0 = performance.now(), DUR = location.hash.length > 1 ? 900 : 1800;
  const step = () => { const k = Math.min(1, (performance.now() - t0) / DUR), e = 1 - Math.pow(1 - k, 2); bar.style.width = (e * 100) + '%'; pct.textContent = Math.round(e * 100) + '%'; tip.textContent = msgs[Math.min(msgs.length - 1, Math.floor(k * (msgs.length - 1) + 0.0001))]; if (k < 1) requestAnimationFrame(step); else { setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 650); }, 180); } };
  requestAnimationFrame(step);
})();
route();
})();
</script>
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9d3d3dfa9ca541c0ae56618ca5021d56"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
