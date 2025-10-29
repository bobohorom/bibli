(function () {
  let deferredPrompt = null;
  const DISMISSED_KEY = 'pwaInstallDismissed';
  const INSTALLED_KEY = 'pwaInstalled';

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function getEl(id) { return document.getElementById(id); }

  function hide(el) { if (el && !el.classList.contains('hidden')) el.classList.add('hidden'); }
  function show(el) { if (el && el.classList.contains('hidden')) el.classList.remove('hidden'); }

  function shouldShowBanner() {
    if (isStandalone()) return false;
    if (localStorage.getItem(INSTALLED_KEY) === '1') return false;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return false;
    // Afficher si on a un prompt différé (Android/Chromium) ou si iOS (fallback manuel)
    return !!deferredPrompt || isIOS();
  }

  function setupHandlers() {
    const banner = getEl('install-banner');
    const btn = getEl('install-btn');
    const closeBtn = getEl('install-close');
    const iosHint = getEl('ios-install-hint');

    if (!banner || !btn || !closeBtn) return;

    // Ecoute l'event PWA (Android/Chromium)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (shouldShowBanner()) show(banner);
    });

    // Si déjà installé, masque la bannière
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      hide(banner);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isStandalone()) hide(banner);
    });

    // Action Installer
    btn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          const choice = await deferredPrompt.userChoice;
          deferredPrompt = null;
          // Quel que soit le choix, on masque la bannière pour ne pas spammer
          hide(banner);
        } catch (err) {
          hide(banner);
        }
      } else if (isIOS()) {
        // iOS ne supporte pas beforeinstallprompt: montrer un hint
        if (iosHint) show(iosHint);
      }
    });

    // Action Fermer/Plus tard
    closeBtn.addEventListener('click', () => {
      localStorage.setItem(DISMISSED_KEY, '1');
      hide(banner);
    });

    // Premier affichage (au cas où l'event arrive plus tard, on attend l'event)
    if (shouldShowBanner()) show(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHandlers);
  } else {
    setupHandlers();
  }
})();
