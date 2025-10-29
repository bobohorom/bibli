# BibliPartage - Guide de déploiement rapide

## 🚀 GitHub Pages (le plus simple)

### 1. Créer le repo
```powershell
cd dist
git init
git add .
git commit -m "PWA statique BibliPartage"
git branch -M main
```

### 2. Connecter à GitHub
Sur GitHub, créer un nouveau repo `biblipartage`, puis :
```powershell
git remote add origin https://github.com/[VOTRE-USER]/biblipartage.git
git push -u origin main
```

### 3. Activer Pages
- Settings → Pages
- Source : "main" / root
- Save

### 4. Accéder
URL : `https://[VOTRE-USER].github.io/biblipartage/`

---

## ⚡ Netlify (drag & drop)

1. Aller sur https://app.netlify.com
2. Glisser-déposer le dossier `dist/`
3. URL fournie automatiquement
4. Terminé ! ✅

---

## 🎯 Tester localement d'abord

```powershell
cd dist
python -m http.server 8000
```

Ouvrir : http://localhost:8000

---

**C'est tout !** Votre PWA sera accessible partout dans le monde, gratuitement, pour toujours. 🌍
