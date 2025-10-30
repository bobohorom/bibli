// Seed helper - exécute directement ce fichier dans la console ou charge-le via script tag
// Usage: <script src="/static/js/seed.js"></script>

(async function seedDB() {
  console.log('🌱 Démarrage du seed...');
  
  // Charger sql.js si pas déjà présent
  if (!window.initSqlJs) {
    console.log('📦 Chargement de sql.js...');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    console.log('✅ sql.js chargé');
  }
  
  // Importer et initialiser la DB
  const { initClientDB, dbAPI } = await import('./db.js');
  await initClientDB();
  console.log('✅ DB initialisée');
  
  // Ajouter des livres
  console.log('📚 Ajout de livres...');
  await dbAPI.addBook(
    'The Pragmatic Programmer',
    'Andrew Hunt; David Thomas',
    '9780201616224',
    'https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg',
    'Classic software craftsmanship book.'
  );
  await dbAPI.addBook(
    'Clean Code',
    'Robert C. Martin',
    '9780132350884',
    'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    'A Handbook of Agile Software Craftsmanship.'
  );
  await dbAPI.addBook(
    'Design Patterns',
    'Gang of Four',
    '9780201633610',
    'https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg',
    'Elements of Reusable Object-Oriented Software.'
  );
  
  // Ajouter des amis
  console.log('👥 Ajout d\'amis...');
  await dbAPI.addFriend('Alice');
  await dbAPI.addFriend('Bob');
  await dbAPI.addFriend('Charlie');
  
  console.log('✅ Seed terminé ! Redirection vers la bibliothèque...');
  setTimeout(() => window.location.hash = '#/library', 1500);
})().catch(err => {
  console.error('❌ Erreur pendant le seed:', err);
});
