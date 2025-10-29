// Module pour récupérer les métadonnées de livres par ISBN
// Utilise Google Books API et OpenLibrary comme fallback

/**
 * Récupère les métadonnées d'un livre par ISBN
 * @param {string} isbn - Le code ISBN du livre
 * @returns {Promise<{title: string, author: string, isbn: string, cover_url: string, description: string}>}
 */
export async function fetchBookByISBN(isbn) {
  // 1. Essayer Google Books API d'abord (meilleure qualité)
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    
    if (data.totalItems > 0) {
      const item = data.items[0];
      const info = item.volumeInfo || {};
      const title = info.title || `Livre inconnu (${isbn})`;
      const authors = info.authors || [];
      const author = authors.join(', ');
      const description = info.description || '';
      
      // Récupérer la meilleure qualité de couverture
      const images = info.imageLinks || {};
      let cover_url = null;
      
      // Ordre de préférence: extraLarge, large, medium, small, thumbnail, smallThumbnail
      for (const size of ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail']) {
        if (images[size]) {
          // Forcer https et améliorer la qualité
          cover_url = images[size]
            .replace('http://', 'https://')
            .replace('&edge=curl', '')
            .replace('zoom=1', 'zoom=0');
          break;
        }
      }
      
      // Essayer de construire une URL depuis l'ID du volume
      if (!cover_url && item.id) {
        cover_url = `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1`;
      }
      
      // Fallback OpenLibrary si pas d'image
      if (!cover_url) {
        cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
      
      return {
        title,
        author,
        isbn,
        cover_url,
        description
      };
    }
  } catch (err) {
    console.log('Google Books API échoué, tentative OpenLibrary...', err.message);
  }
  
  // 2. Fallback sur OpenLibrary
  try {
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    
    const title = data.title || `Livre inconnu (${isbn})`;
    
    // Récupérer les noms des auteurs
    const authors = data.authors || [];
    const authorNames = [];
    
    for (const auth of authors.slice(0, 3)) {
      try {
        const authorKey = auth.key;
        const authorResp = await fetch(`https://openlibrary.org${authorKey}.json`, {
          signal: AbortSignal.timeout(3000)
        });
        const authorData = await authorResp.json();
        authorNames.push(authorData.name || 'Inconnu');
      } catch {
        authorNames.push('Inconnu');
      }
    }
    
    const author = authorNames.join(', ');
    const cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    
    return {
      title,
      author,
      isbn,
      cover_url,
      description: ''
    };
  } catch (err) {
    console.log('OpenLibrary échoué, retour fallback minimal...', err.message);
  }
  
  // 3. Fallback minimal
  return {
    title: `Livre ${isbn}`,
    author: '',
    isbn,
    cover_url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
    description: ''
  };
}
