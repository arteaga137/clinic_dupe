// =====================================================================
// random.js — números "aleatorios" REPRODUCIBLES
// =====================================================================
// Math.random() da resultados distintos cada vez. Para generar datos de
// práctica queremos lo contrario: que el mismo paciente tenga siempre la
// misma PIO base y que el mismo día genere siempre la misma agenda.
//
// Para eso usamos un PRNG (generador pseudoaleatorio) con SEMILLA: a
// partir de un número inicial produce una secuencia que parece aleatoria
// pero que es idéntica si repites la semilla. Este es "mulberry32", un
// algoritmo muy corto y suficiente para datos de prueba (no para
// criptografía).
// =====================================================================

/** Convierte un texto (p. ej. "2026-09-29" o "700215") en un número semilla. */
export function hashSeed(text) {
  let h = 2166136261; // algoritmo FNV-1a: mezcla cada carácter en el número
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // ">>> 0" lo deja como entero positivo de 32 bits
}

/** Crea un generador. rng() devuelve un decimal en [0, 1), como Math.random(). */
export function createRng(seed) {
  let a = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Utilidades construidas sobre rng(): así el resto del código se lee fácil.
  rng.int = (min, max) => min + Math.floor(rng() * (max - min + 1)); // entero entre min y max (incluidos)
  rng.float = (min, max, decimals = 2) => Number((min + rng() * (max - min)).toFixed(decimals));
  rng.chance = (p) => rng() < p; // true con probabilidad p (0.3 = 30 %)
  rng.pick = (list) => list[Math.floor(rng() * list.length)];
  /** Elige según pesos: weighted([['A', 3], ['B', 1]]) → 'A' el 75 % de las veces. */
  rng.weighted = (pairs) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (const [value, w] of pairs) { r -= w; if (r < 0) return value; }
    return pairs[pairs.length - 1][0];
  };
  /** Baraja una copia de la lista (algoritmo de Fisher-Yates). */
  rng.shuffle = (list) => {
    const a2 = [...list];
    for (let i = a2.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  return rng;
}
