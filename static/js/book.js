// ES module for Book detail page (client-side rendering)
import { initClientDB, dbAPI } from '/static/js/db.js';
import { toast, showLoader, hideLoader } from '/static/js/ui.js';

function el(sel, root=document){ return root.querySelector(sel); }

function getBookIdFromURL() {
  const path = window.location.pathname;
  const match = path.match(/\/book\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function renderBook() {
  const bookId = getBookIdFromURL();
  if (!bookId) {
    toast('Livre introuvable', 'error');
    setTimeout(() => window.location.href = '/library', 1500);
    return;
  }

  const book = await dbAPI.getBook(bookId);
  if (!book) {
    toast('Livre introuvable - redirection vers la bibliothèque...', 'error');
    setTimeout(() => window.location.href = '/library', 1500);
    return;
  }

  const exchange = await dbAPI.getExchangeForBook(bookId);
  const isInExchange = !!exchange;

  // Update page title
  document.title = `${book.title} · BibliPartage`;

  // Render image
  const img = el('#bookCover');
  if (img) {
    img.src = book.cover_url || '/static/nocover300x450.svg';
    img.alt = 'Couverture';
    img.className = 'cover-preview rounded'; // Ensure classes are applied
    img.loading = 'lazy';
    img.onerror = function() {
      this.src = '/static/nocover300x450.svg';
    };
  }

  // Render details
  const titleEl = el('#bookTitle');
  if (titleEl) titleEl.textContent = book.title;

  const authorEl = el('#bookAuthor');
  if (authorEl) authorEl.textContent = book.author || '';

  const isbnEl = el('#bookISBN');
  if (isbnEl) isbnEl.textContent = `ISBN: ${book.isbn || ''}`;

  const descEl = el('#bookDescription');
  if (descEl) descEl.textContent = book.description || '';

  // Render exchange status
  const actionsContainer = el('#bookActions');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    
    if (isInExchange) {
      const btnDisabled = document.createElement('button');
      btnDisabled.className = 'btn btn-primary';
      btnDisabled.disabled = true;
  btnDisabled.title = 'Ce livre fait déjà l\'objet d\'un prêt';
  btnDisabled.textContent = 'Proposer un prêt';
      
      const info = document.createElement('div');
      info.className = 'muted small mt-8';
  info.innerHTML = `En prêt avec <strong>${exchange.friend_name}</strong> depuis le ${exchange.created_at}`;
      
      actionsContainer.appendChild(btnDisabled);
      actionsContainer.appendChild(info);
    } else {
      const btnExchange = document.createElement('a');
      btnExchange.href = '/friends';
      btnExchange.className = 'btn btn-primary';
  btnExchange.textContent = 'Proposer un prêt';
      
      const formDelete = document.createElement('form');
      formDelete.id = 'deleteBookForm';
      const btnDelete = document.createElement('button');
      btnDelete.type = 'submit';
      btnDelete.className = 'btn btn-danger';
      btnDelete.textContent = 'Supprimer le livre';
      formDelete.appendChild(btnDelete);
      
      actionsContainer.appendChild(btnExchange);
      actionsContainer.appendChild(formDelete);
      
      // Wire delete
      formDelete.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${book.title}" ?`)) return;
        showLoader();
        try {
          const res = await dbAPI.deleteBook(bookId);
          if (!res.ok) { toast(res.error, 'error'); return; }
          toast('Livre supprimé.', 'success');
          setTimeout(() => window.location.href = '/library', 1000);
        } finally {
          hideLoader();
        }
      });
    }
  }

  // Populate cover update form
  const coverInput = el('#coverInput');
  if (coverInput) {
    coverInput.value = book.cover_url || '';
  }
}

async function main() {
  showLoader();
  try {
    await initClientDB();
    await renderBook();
  } finally {
    hideLoader();
  }

  // Wire cover update form
  const coverForm = el('#updateCoverForm');
  if (coverForm) {
    coverForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookId = getBookIdFromURL();
      const input = el('#coverInput');
      const url = input.value.trim();
      showLoader();
      const res = await dbAPI.updateBookCover(bookId, url);
      if (!res.ok) return toast(res.error, 'error');
      toast('Image du livre mise à jour.', 'success');
      await renderBook();
      hideLoader();
    });
  }
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', main);
}else{
  main();
}
