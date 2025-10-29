// Module UI partagé: helpers toast et loader pour toutes les pages
// Usage:
// import { toast, showLoader, hideLoader } from '/static/js/ui.js';

function el(sel, root=document){ return root.querySelector(sel); }

/**
 * Affiche un message toast (notification temporaire)
 * @param {string} msg - Le message à afficher
 * @param {string} type - Type de toast: 'success' ou 'error'
 */
export function toast(msg, type='success'){
  let list = el('.flash-list');
  if (!list) {
    const main = el('main.main');
    if (!main) return;
    list = document.createElement('div');
    list.className = 'flash-list';
    main.insertBefore(list, main.firstChild);
  }
  const div = document.createElement('div');
  div.className = `flash ${type==='success' ? 'flash-success' : 'flash-error'}`;
  div.textContent = msg;
  list.appendChild(div);
  
  // Auto-dismiss après 3 secondes
  setTimeout(()=>div.remove(), 3000);
}

/**
 * Crée et retourne l'overlay de chargement (singleton)
 * @returns {HTMLElement}
 */
function ensureLoader(){
  let o = document.getElementById('loader-overlay');
  if (!o){
    o = document.createElement('div');
    o.id = 'loader-overlay';
    o.className = 'loader-overlay hidden';
    o.innerHTML = '<div class="loader"><div class="spinner" aria-hidden="true"></div><div class="loader-text">Chargement…</div></div>';
    document.body.appendChild(o);
  }
  return o;
}

/**
 * Affiche l'overlay de chargement
 */
export function showLoader(){ 
  ensureLoader().classList.remove('hidden'); 
}

/**
 * Masque l'overlay de chargement
 */
export function hideLoader(){ 
  ensureLoader().classList.add('hidden'); 
}
