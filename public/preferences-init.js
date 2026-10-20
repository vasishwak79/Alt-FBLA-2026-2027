/*
 * Runs before React loads so the page never flashes the wrong theme.
 * Mirrors the logic in src/context/PreferencesContext.jsx.
 */
(function () {
  var root = document.documentElement;
  var prefs = {};
  try {
    prefs = JSON.parse(window.localStorage.getItem('commons:preferences') || '{}') || {};
  } catch (error) {
    prefs = {};
  }

  var theme = prefs.theme || 'system';
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.dataset.theme = theme;
  root.dataset.textSize = prefs.textSize || 'default';
  root.dataset.contrast = prefs.contrast || 'normal';
  root.dataset.motion = prefs.motion || 'system';
  root.dataset.font = prefs.font || 'default';
  root.dataset.links = prefs.underlineLinks ? 'underline' : 'default';
})();
