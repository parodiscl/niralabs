/**
 * NIRA LABS — Labs Experiment Loader
 * Carga un experimento al azar en cada visita.
 * Para agregar nuevos: importar el módulo y agregarlo al array EXPERIMENTS.
 */

import { init as initCosmos } from './experiments/cosmos.js';

/* ═══════════════════════════════════════════════════════
   REGISTRO DE EXPERIMENTOS
   Cada entrada: { id, name, init }
═══════════════════════════════════════════════════════ */
const EXPERIMENTS = [
  {
    id:   'cosmos',
    name: 'DERIVA — 2157',
    init: initCosmos,
  },
  // Próximos experimentos:
  // { id: 'fluid', name: 'FLUJO — 2158', init: initFluid },
  // { id: 'grid',  name: 'GRID — 2159',  init: initGrid  },
];

/* ═══════════════════════════════════════════════════════
   LOADER
═══════════════════════════════════════════════════════ */
const stage  = document.getElementById('stage');
const loader = document.getElementById('loader');

// Elegir experimento — random, o forzar via ?exp=cosmos
function pickExperiment() {
  const param = new URLSearchParams(location.search).get('exp');
  if (param) {
    const found = EXPERIMENTS.find(e => e.id === param);
    if (found) return found;
  }
  return EXPERIMENTS[Math.floor(Math.random() * EXPERIMENTS.length)];
}

async function boot() {
  const exp = pickExperiment();

  // Actualizar título de la página
  document.title = `${exp.name} — Nira Labs Labs`;

  // Pequeño delay para que se vea el loader
  await new Promise(r => setTimeout(r, 600));

  // Lanzar experimento
  exp.init(stage);

  // Ocultar loader
  loader.classList.add('hidden');
  setTimeout(() => { loader.style.display = 'none'; }, 700);
}

boot();
