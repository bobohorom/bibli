# BibliPartage - PWA Statique

Version 100% statique de BibliPartage, sans serveur backend.

## 🎯 Fonctionnalités

✅ **PWA complète** : installable, offline, cache-first  
✅ **Base de données client** : sql.js + IndexedDB  
✅ **Aucun serveur requis** : HTML/CSS/JS pur  
✅ **Router client-side** : navigation hash-based  
✅ **Hébergement gratuit** : GitHub Pages, Netlify, Vercel, etc.

## 📦 Structure

```
dist/
├── index.html          # Point d'entrée unique (SPA)
├── sw.js               # Service Worker
├── manifest.webmanifest
└── static/
    ├── css/            # Styles
    ├── js/             # Scripts (db.js, router.js, etc.)
    ├── icons/          # Icônes PWA
    └── fonts/          # Polices
```

## 🚀 Déploiement

### Option 1 : GitHub Pages (recommandé)

1. **Créer un repo GitHub**
   ```powershell
   cd dist
   git init
   git add .
   git commit -m "Initial commit - PWA statique"
   git branch -M main
   git remote add origin https://github.com/[USER]/biblipartage.git
   git push -u origin main
   ```

2. **Activer GitHub Pages**
   - Aller sur Settings → Pages
   - Source : "Deploy from a branch"
   - Branch : `main` / root
   - Save

3. **Accéder à l'app**
   - URL : `https://[USER].github.io/biblipartage/`
   - Installable via Chrome/Edge/Safari

### Option 2 : Netlify (drag & drop)

1. **Créer un compte** sur https://netlify.com
2. **Glisser-déposer** le dossier `dist/`
3. **URL fournie** : `https://[nom-aléatoire].netlify.app`
4. **Custom domain** : configurable gratuitement

### Option 3 : Vercel

```powershell
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd dist
vercel
```

### Option 4 : Cloudflare Pages

1. **Créer un repo** (comme GitHub Pages)
2. **Connecter à Cloudflare Pages**
3. **Build settings** :
   - Build command : (vide)
   - Output directory : `/`
4. **Déployer**

## 🧪 Tester localement

### Avec Python (simple)
```powershell
cd dist
python -m http.server 8000
# Ouvrir http://localhost:8000
```

### Avec Node.js
```powershell
cd dist
npx serve
# Ouvrir l'URL fournie
```

### Avec Live Server (VS Code)
1. Installer l'extension "Live Server"
2. Clic droit sur `dist/index.html` → "Open with Live Server"

## 📱 Installation PWA

Une fois déployé avec HTTPS :

1. **Chrome/Edge Desktop** : icône ⊕ dans l'omnibar
2. **Chrome Mobile** : Menu → "Installer l'application"
3. **Safari iOS** : Partager → "Sur l'écran d'accueil"
4. **Bannière auto** : apparaît si critères remplis

## ✅ Vérifications

### Manifest
```
https://[votre-url]/manifest.webmanifest
```
Doit retourner JSON valide.

### Service Worker
DevTools → Application → Service Workers  
Doit montrer `sw.js` actif.

### Lighthouse
DevTools → Lighthouse → Run PWA audit  
Doit avoir score 100%.

## 🔄 Différences avec version Flask

| Aspect | Flask | Statique |
|--------|-------|----------|
| **Serveur** | Python requis | Aucun |
| **Routes** | Flask (`@app.route`) | Hash router (#/library) |
| **Templates** | Jinja2 | Fonctions JS |
| **Hébergement** | Render, Railway, etc. | GitHub Pages, Netlify |
| **Coût** | Limites gratuites | Vraiment gratuit |
| **Performance** | Bon | Excellent (CDN) |

## 📊 Comparaison hébergement

| Service | Type | Limites | Setup |
|---------|------|---------|-------|
| **GitHub Pages** | Statique | 100 GB bande passante/mois | ⭐⭐⭐⭐⭐ |
| **Netlify** | Statique | 100 GB/mois, 300 min build | ⭐⭐⭐⭐⭐ |
| **Vercel** | Statique | 100 GB/mois | ⭐⭐⭐⭐ |
| **Cloudflare Pages** | Statique | Illimité | ⭐⭐⭐⭐ |

## 🛠️ Développement

### Ajouter une nouvelle page

1. **Ajouter la route** dans `static/js/router.js` :
   ```javascript
   const routes = {
     // ...
     '/nouvelle-page': renderNouvellePage
   };
   ```

2. **Créer la fonction render** :
   ```javascript
   function renderNouvellePage() {
     app.innerHTML = `<h1>Ma nouvelle page</h1>`;
     document.title = 'Nouvelle page · BibliPartage';
   }
   ```

3. **Ajouter un lien** :
   ```html
   <a href="#/nouvelle-page">Nouvelle page</a>
   ```

### Mettre à jour le cache

1. Éditer `dist/sw.js`
2. Incrémenter `CACHE_NAME` : `'bp-cache-v7'`
3. Ajouter nouveaux assets à `CORE_ASSETS`

## 🔐 Sécurité

✅ **Pas de backend** = pas d'injection SQL serveur  
✅ **Données locales** = contrôle total utilisateur  
✅ **HTTPS** = requis par PWA (automatique sur toutes les plateformes)  
⚠️ **Pas de sync** = données perdues si cache effacé (export/import disponible)

## 📝 Notes

- **URLs** : hash-based (`#/library`) pour compatibilité hébergement statique
- **DB** : sql.js en WASM + IndexedDB pour persistance
- **Offline** : fonctionne complètement hors ligne après première visite
- **Multi-onglets** : utiliser un seul onglet pour éviter conflits IndexedDB

## 🎉 Avantages

✅ Hébergement vraiment gratuit sans limites de temps  
✅ Déploiement instantané (secondes)  
✅ Performances maximales (CDN global)  
✅ Pas de maintenance serveur  
✅ Évolutif à l'infini (stateless)  
✅ Fonctionne offline  

---

**Prêt à déployer !** 🚀  
Choisissez une plateforme ci-dessus et votre PWA sera en ligne en quelques minutes.
