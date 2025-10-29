// Simple client-side router for static PWA
(function() {
  const app = document.getElementById('app');
  
  const routes = {
    '/': renderWelcome,
    '/library': renderLibrary,
    '/scan': renderScan,
    '/add': renderAdd,
    '/confirm': renderConfirm,
    '/friends': renderFriends,
    '/book/:id': renderBook
  };

  function navigate() {
    const hash = window.location.hash.slice(1) || '/';
    
    // Match route avec paramètres
    let matched = false;
    for (const [pattern, handler] of Object.entries(routes)) {
      const regex = new RegExp('^' + pattern.replace(/:\w+/g, '(\\d+)') + '$');
      const match = hash.match(regex);
      if (match) {
        handler(match.slice(1)); // Passer les params capturés
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      app.innerHTML = '<h1>Page non trouvée</h1><a href="#/" class="btn btn-primary">Retour à l\'accueil</a>';
    }
    
    // Fermer le menu mobile après navigation
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      const icon = document.getElementById('mobile-menu-btn').querySelector('.material-symbols-outlined');
      icon.textContent = 'menu';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }

  function renderWelcome() {
    app.innerHTML = `
      <link rel="stylesheet" href="./static/welcome.css">
      <!-- Hero -->
      <div class="welcome-hero">
        <div class="hero hero--welcome"></div>
      </div>

      <!-- Headline (clickable) -->
      <a href="#/library" class="headline-link" aria-label="Voir ma bibliothèque">
        <div class="headline">
          <h1>Gérez votre bibliothèque personnelle.</h1>
          <p>Suivez vos lectures et partagez vos histoires préférées avec vos amis.</p>
        </div>
      </a>

      <!-- Feature Highlights -->
      <div class="features">
        <a href="#/library" class="card">
          <div class="icon"><span class="material-symbols-outlined">menu_book</span></div>
          <div>
            <h2>Organiser &amp; Suivre</h2>
            <p>Gardez votre collection organisée et suivez vos prêts de lecture.</p>
          </div>
        </a>

        <a href="#/scan" class="card">
          <div class="icon"><span class="material-symbols-outlined">qr_code_scanner</span></div>
          <div>
            <h2>Scanner</h2>
            <p>Ajoutez rapidement des livres à votre bibliothèque en scannant leurs codes-barres.</p>
          </div>
        </a>

        <a href="#/add" class="card">
          <div class="icon"><span class="material-symbols-outlined">library_add</span></div>
          <div>
            <h2>Ajouter</h2>
            <p>Ajoutez manuellement des livres à votre bibliothèque.</p>
          </div>
        </a>

        <a href="#/friends" class="card">
          <div class="icon"><span class="material-symbols-outlined">groups</span></div>
          <div>
            <h2>Partager &amp; Échanger</h2>
            <p>Connectez-vous avec vos amis pour emprunter et prêter des livres facilement.</p>
          </div>
        </a>
      </div>
    `;
    document.title = 'Bienvenue · BibliPartage';
  }

  function renderLibrary() {
    app.innerHTML = `
      <link rel="stylesheet" href="./static/library.css">
      <div class="lib-controls">
        <form id="searchForm" class="flex-1">
          <input id="searchInput" class="input" type="search" placeholder="Rechercher par titre, auteur, ISBN" />
        </form>
        <div class="lib-actions">
          <button id="exportDB" class="btn btn-outline" title="Télécharger votre bibliothèque">
            <span class="material-symbols-outlined icon sm">download</span>
            <span>Exporter</span>
          </button>
          <label for="importDB" class="btn btn-outline" title="Importer une bibliothèque depuis un fichier">
            <span class="material-symbols-outlined icon sm">upload</span>
            <span>Importer</span>
          </label>
          <input type="file" id="importDB" accept=".sqlite,.db,.sqlite3" class="visually-hidden" />
        </div>
      </div>

      <div id="booksGrid" class="grid-books"></div>
      
      <noscript>
        <p class="muted">Activez JavaScript pour afficher votre bibliothèque.</p>
      </noscript>
    `;
    document.title = 'Ma bibliothèque · BibliPartage';
    
    // Charger le script de la page
    loadScript('./static/js/library.js', true);
  }

  function renderScan() {
    app.innerHTML = `
      <link rel="stylesheet" href="./static/scan.css">
      <h1 class="page-title">Scanner un ISBN</h1>
      <div class="scan-layout">
        <div>
          <div id="scanner-container">
            <div id="camera-notice">pas de scan en cours...</div>
            <div id="interactive" class="viewport hidden"></div>
            <canvas id="canvas" class="hidden"></canvas>
            <div id="scan-overlay" class="hidden">
              <div class="scan-message">
                <div>Positionnez le code‑barres </div><div>dans le cadre ci‑dessous.</div>
              </div>
              <div class="frame-wrap">
                <div class="scan-window">
                  <div class="scan-line"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="controls">
            <button id="start-scan" class="btn btn-success">Démarrer le scan</button>
            <button id="stop-scan" class="btn btn-danger hidden">Arrêter</button>
          </div>
          <div id="sourceSelectPanel" class="hidden">
            <label for="sourceSelect" class="label">Caméra</label>
            <select id="sourceSelect" class="input"></select>
          </div>
          <p class="hint">Astuce: orientez le code-barres ISBN vers la caméra. Le scan détecte automatiquement les codes EAN-13.</p>
        </div>
        <div>
          <form id="scanForm">
            <div class="form-row">
              <label for="isbn" class="label">ISBN détecté / Saisie manuelle</label>
              <input id="isbn" name="isbn" class="input" placeholder="978..." />
            </div>
            <button type="submit" class="btn btn-primary">Continuer</button>
          </form>
        </div>
      </div>
    `;
    document.title = 'Scanner un ISBN · BibliPartage';
    
    // Charger Quagga puis le script de scan
    loadScript('./static/quagga.min.js', false, () => {
      initScanner();
    });
  }

  function renderAdd() {
    app.innerHTML = `
      <h1 class="page-title">Ajouter un livre</h1>
      <form id="addBookForm" class="grid-2">
        <div>
          <div class="form-row">
            <label for="title" class="label">Titre</label>
            <input id="title" required name="title" class="input" placeholder="Ex: Clean Code" />
          </div>
          <div class="form-row">
            <label for="author" class="label">Auteur</label>
            <input id="author" name="author" class="input" placeholder="Ex: Robert C. Martin" />
          </div>
          <div class="form-row">
            <label for="isbn" class="label">ISBN</label>
            <input id="isbn" name="isbn" class="input" placeholder="978..." />
          </div>
          <div class="form-row">
            <label for="cover_url" class="label">URL de couverture</label>
            <input id="cover_url" name="cover_url" class="input" placeholder="https://..." />
          </div>
          <div class="form-row">
            <label for="description" class="label">Description</label>
            <textarea id="description" name="description" rows="4" class="input" placeholder="Notes sur le livre"></textarea>
          </div>
          <div class="row">
            <button type="submit" class="btn btn-primary">Enregistrer</button>
            <a href="#/scan" class="btn btn-outline">Scanner un ISBN</a>
          </div>
        </div>
      </form>
    `;
    document.title = 'Ajouter un livre · BibliPartage';
    
    loadScript('./static/js/add.js', true);
  }

  function renderConfirm() {
    app.innerHTML = `
      <h1 class="page-title">Confirmer les détails du livre</h1>
      <div class="grid-2">
        <div>
          <img id="confirmCover" class="cover-preview rounded" src="./static/nocover300x450.svg" alt="Couverture" />
        </div>
        <div>
          <form id="confirmForm">
            <div class="form-row">
              <label for="title" class="label">Titre</label>
              <input id="title" name="title" class="input" />
            </div>
            <div class="form-row">
              <label for="author" class="label">Auteur</label>
              <input id="author" name="author" class="input" />
            </div>
            <div class="form-row">
              <label for="isbn" class="label">ISBN</label>
              <input id="isbn" name="isbn" class="input" />
            </div>
            <div class="form-row">
              <label for="cover_url" class="label">URL de couverture</label>
              <input id="cover_url" name="cover_url" class="input" />
            </div>
            <div class="form-row">
              <label for="description" class="label">Description</label>
              <textarea id="description" name="description" rows="3" class="input"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Ajouter à ma bibliothèque</button>
          </form>
        </div>
      </div>
    `;
    document.title = 'Confirmer le livre · BibliPartage';
    
    loadScript('./static/js/confirm.js', true);
  }

  function renderFriends() {
    app.innerHTML = `
      <div class="grid-2">
        <div>
          <h2 class="section-title">Mes amis</h2>
          <form id="addFriendForm" class="row mb-16">
            <input name="name" class="input flex-1" placeholder="Nom de l'ami" />
            <button type="submit" class="btn btn-primary">Ajouter</button>
          </form>
          <ul id="friendsList" class="stack-2"></ul>
        </div>
        <div>
          <h2 class="section-title">Créer un prêt</h2>
          <form id="createExchangeForm" class="mb-24">
            <div class="mb-16">
              <label for="book_id" class="label">Livre</label>
              <select id="book_id" name="book_id" class="input"></select>
            </div>
            <div class="mb-16">
              <label for="friend_id" class="label">Ami</label>
              <select id="friend_id" name="friend_id" class="input"></select>
            </div>
            <button type="submit" class="btn btn-primary">Prêter</button>
          </form>

          <h2 class="section-title">Demandes récentes</h2>
          <div id="exchangesList" class="stack-2"></div>
        </div>
      </div>
    `;
    document.title = 'Amis & Prêts · BibliPartage';
    
    loadScript('./static/js/friends.js', true);
  }

  function renderBook(params) {
    const bookId = params[0];
    app.innerHTML = `
      <div class="stack-2 px-1p">
        <img id="bookCover" class="cover-preview rounded" src="./static/nocover300x450.svg" alt="Couverture" />
        <div class="stack-2">
          <h1 id="bookTitle" class="page-title no-xpad">Chargement...</h1>
          <div id="bookAuthor" class="muted"></div>
          <div id="bookISBN" class="muted small"></div>
          <p id="bookDescription"></p>
          <div id="bookActions" class="stack-2"></div>
        </div>
        <form id="updateCoverForm" class="stack-2">
          <input id="coverInput" name="cover_url" class="input" placeholder="URL de l'image (https://...)" />
          <button type="submit" class="btn btn-primary">Mettre à jour l'image</button>
        </form>
      </div>
    `;
    document.title = 'Livre · BibliPartage';
    
    // Stocker l'ID du livre pour le script
    window.__BOOK_ID__ = parseInt(bookId);
    loadScript('./static/js/book.js', true);
  }

  // Helper pour charger les scripts dynamiquement
  const loadedScripts = new Set();
  
  function loadScript(src, isModule = false, callback) {
    // Si déjà chargé, exécuter le callback direct
    if (loadedScripts.has(src)) {
      if (callback) callback();
      return;
    }
    
    const script = document.createElement('script');
    if (isModule) script.type = 'module';
    script.src = src;
    script.onload = () => {
      loadedScripts.add(src);
      if (callback) callback();
    };
    script.onerror = () => console.error('Failed to load script:', src);
    document.body.appendChild(script);
  }

  // Scanner initialization (appelé après chargement de Quagga)
  function initScanner() {
    import('./ui.js').then(({ toast, showLoader, hideLoader }) => {
      const isbnInput = document.getElementById('isbn');
      const startBtn = document.getElementById('start-scan');
      const stopBtn = document.getElementById('stop-scan');
      const notice = document.getElementById('camera-notice');
      const interactive = document.getElementById('interactive');
      const scanWindow = document.querySelector('.scan-window');
      const sourceSelectPanel = document.getElementById('sourceSelectPanel');
      const sourceSelect = document.getElementById('sourceSelect');
      
      let scanning = false;
      let availableCameras = [];
      let lastDetectedCode = null;
      let detectionInProgress = false;

      window.addEventListener('load', async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          availableCameras = devices.filter(device => device.kind === 'videoinput');
          
          if (availableCameras.length === 0) {
            notice.textContent = 'Aucune caméra trouvée';
            return;
          }
          
          sourceSelect.innerHTML = '';
          availableCameras.forEach((cam, idx) => {
            const opt = document.createElement('option');
            opt.text = cam.label || `Caméra ${idx + 1}`;
            opt.value = cam.deviceId;
            sourceSelect.appendChild(opt);
          });
          
          if (availableCameras.length > 0) {
            sourceSelect.value = availableCameras[0].deviceId;
          }
          
          if (availableCameras.length > 1) {
            sourceSelectPanel.classList.remove('hidden');
          }
          
          sourceSelect.onchange = () => {
            if (scanning) {
              stopScanner();
              setTimeout(() => startScanner(), 100);
            }
          };
        } catch (err) {
          console.error('Erreur caméra:', err);
        }
      });

      async function startScanner() {
        if (scanning) return;
        
        notice.textContent = 'Démarrage de la caméra...';
        notice.classList.remove('hidden');
        scanWindow.classList.remove('detected');
        
        const selectedDeviceId = sourceSelect.value || (availableCameras[0] && availableCameras[0].deviceId);
        
        const config = {
          inputStream: {
            type: 'LiveStream',
            target: interactive,
            constraints: {
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          },
          locator: {
            patchSize: 'medium',
            halfSample: true
          },
          numOfWorkers: 4,
          frequency: 10,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader'],
            multiple: false
          },
          locate: true
        };
        
        Quagga.init(config, (err) => {
          if (err) {
            console.error('Erreur init Quagga:', err);
            notice.textContent = "Erreur caméra. Vérifiez les permissions.";
            notice.classList.remove('hidden');
            toast('Erreur caméra: ' + err.message, 'error');
            return;
          }
          
          Quagga.start();
          scanning = true;
          notice.classList.add('hidden');
          interactive.classList.remove('hidden');
          scanWindow.classList.remove('hidden');
          startBtn.classList.add('hidden');
          stopBtn.classList.remove('hidden');
        });
        
        Quagga.onDetected((result) => {
          if (detectionInProgress) return;
          
          const code = result.codeResult.code;
          if (code === lastDetectedCode) return;
          if (!/^\d+$/.test(code)) return;
          
          if (code && (code.length === 13 || code.length === 10)) {
            detectionInProgress = true;
            lastDetectedCode = code;
            
            isbnInput.value = code;
            isbnInput.classList.add('input-valid');
            scanWindow.classList.add('detected');
            
            toast('✅ ISBN détecté: ' + code, 'success');
            
            setTimeout(() => {
              stopScanner();
              detectionInProgress = false;
            }, 1500);
          }
        });
      }

      function stopScanner() {
        if (!scanning) return;
        
        Quagga.stop();
        scanning = false;
        interactive.classList.add('hidden');
        scanWindow.classList.add('hidden');
        scanWindow.classList.remove('detected');
        notice.classList.remove('hidden');
        notice.textContent = 'Scanner arrêté. Cliquez "Démarrer" pour relancer.';
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        
        setTimeout(() => {
          lastDetectedCode = null;
        }, 2000);
      }

      startBtn.addEventListener('click', startScanner);
      stopBtn.addEventListener('click', stopScanner);
      
      window.addEventListener('beforeunload', () => {
        if (scanning) Quagga.stop();
      });
      
      const scanForm = document.getElementById('scanForm');
      scanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isbn = isbnInput.value.trim();
        
        if (!isbn) {
          toast('Entrez un ISBN valide.', 'error');
          return;
        }
        
        sessionStorage.setItem('scanned_isbn', isbn);
        window.location.hash = '#/confirm';
      });
    });
  }

  // Listen to hash changes
  window.addEventListener('hashchange', navigate);
  
  // Initial navigation
  navigate();
})();
