// ES module to wire the Friends page to client-side DB
import { initClientDB, dbAPI } from './db.js';
import { toast, showLoader, hideLoader } from './ui.js';

function el(sel, root=document){ return root.querySelector(sel); }
function els(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function renderFriends(friends, exchangeFriendIds){
  const ul = el('#friendsList');
  if (!ul) return;
  ul.innerHTML = '';
  if (!friends.length){
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = "Aucun ami pour l'instant.";
    ul.appendChild(li);
    return;
  }
  friends.forEach(f => {
    const li = document.createElement('li');
    li.className = 'card friend-item';
    const span = document.createElement('span');
    span.textContent = f.name;
    const btn = document.createElement('button');
    btn.className = 'btn-icon-delete';
  btn.title = exchangeFriendIds.has(f.id) ? 'Impossible de supprimer : prêt en cours' : `Supprimer ${f.name}`;
    btn.disabled = exchangeFriendIds.has(f.id);
    btn.innerHTML = '<span class="material-symbols-outlined icon sm">delete</span>';
    btn.addEventListener('click', async (e)=>{
      e.preventDefault();
      showLoader();
      try {
        const res = await dbAPI.deleteFriend(f.id);
        if (!res.ok) { toast(res.error, 'error'); return; }
        await refresh();
        toast('Ami supprimé.', 'success');
      } finally {
        hideLoader();
      }
    });
    li.appendChild(span);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function renderExchanges(exchanges, friends){
  const wrap = el('#exchangesList');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!exchanges.length){
    const div = document.createElement('div');
    div.className = 'muted';
    div.textContent = 'Aucune demande.';
    wrap.appendChild(div);
    return;
  }
  const friendMap = Object.fromEntries(friends.map(f => [f.id, f.name]));
  exchanges.forEach(e => {
    const card = document.createElement('div');
    card.className = 'card exchange-item';
    const left = document.createElement('div');
    const friendName = friendMap[e.friend_id] || `Ami #${e.friend_id}`;
    left.innerHTML = `"${e.book_title||''}" avec ${friendName} — <strong>${e.status}</strong><div class="muted small">Créée le ${e.created_at}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn-icon-delete';
    btn.title = 'Supprimer cette demande';
    btn.innerHTML = '<span class="material-symbols-outlined icon sm">delete</span>';
    btn.addEventListener('click', async (ev)=>{
      ev.preventDefault();
      showLoader();
      try {
        await dbAPI.deleteExchange(e.id);
        await refresh();
        toast("Demande de prêt supprimée.", 'success');
      } finally {
        hideLoader();
      }
    });
    card.appendChild(left);
    card.appendChild(btn);
    wrap.appendChild(card);
  });
}

async function populateFriendSelect(friends){
  const sel = el('#friend_id');
  if (!sel) return;
  sel.innerHTML = '';
  friends.forEach(f => {
    const opt = document.createElement('option');
    opt.value = String(f.id);
    opt.textContent = f.name;
    sel.appendChild(opt);
  });
}

async function populateBookSelect(exchangeBookIds) {
  const books = await dbAPI.listBooks();
  const sel = el('#book_id');
  if (!sel) return;
  sel.innerHTML = '';
  
  if (!books.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Aucun livre disponible';
    opt.disabled = true;
    opt.selected = true;
    sel.appendChild(opt);
    return;
  }
  
  books.forEach(b => {
    const opt = document.createElement('option');
    opt.value = String(b.id);
    opt.textContent = b.title;
    if (exchangeBookIds.has(b.id)) {
      opt.disabled = true;
  opt.textContent += ' (déjà en prêt)';
    }
    sel.appendChild(opt);
  });
}

async function refresh(){
  showLoader();
  try{
    const friends = await dbAPI.listFriends();
    const exchanges = await dbAPI.listExchanges();
    const exFriendIds = await dbAPI.exchangeFriendIds();
    const exBookIds = await dbAPI.exchangeBookIds();
    renderFriends(friends, exFriendIds);
    renderExchanges(exchanges, friends);
    await populateFriendSelect(friends);
    await populateBookSelect(exBookIds);
  } finally {
    hideLoader();
  }
}

async function main(){
  showLoader();
  try { await initClientDB(); } finally { hideLoader(); }
  // Hide server-rendered lists if present (progressive enhancement)
  const serverLists = els('[data-server-rendered]');
  serverLists.forEach(n => n.remove());

  // Wire add friend form
  const addForm = el('#addFriendForm');
  if (addForm){
    addForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const input = el('input[name="name"]', addForm);
      const name = input.value;
      showLoader();
      try {
        const res = await dbAPI.addFriend(name);
        if (!res.ok) { toast(res.error, 'error'); return; }
        input.value = '';
        await refresh();
        toast('Ami ajouté.', 'success');
      } finally {
        hideLoader();
      }
    });
  }

  // Wire create exchange form
  const exForm = el('#createExchangeForm');
  if (exForm){
    exForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const bookSel = el('#book_id');
      const friendSel = el('#friend_id');
      const book_id = Number(bookSel.value);
      const friend_id = Number(friendSel.value);
      
      // Check if book is already in exchange (client-side validation)
      const exBookIds = await dbAPI.exchangeBookIds();
      if (exBookIds.has(book_id)) {
  toast('Ce livre fait déjà l\'objet d\'un prêt.', 'error');
        return;
      }
      
  const book_title = bookSel.options[bookSel.selectedIndex]?.text?.replace(' (déjà en prêt)', '') || '';
      showLoader();
      try {
        const res = await dbAPI.createExchange(book_id, friend_id, book_title);
        if (!res.ok) { toast(res.error, 'error'); return; }
        await refresh();
        toast("Demande de prêt créée.", 'success');
      } finally {
        hideLoader();
      }
    });
  }

  await refresh();
}

// Ensure sql.js is loaded before running main
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', main);
}else{
  main();
}
