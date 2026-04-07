/* Theme preference handling is isolated here so page boot code stays small. */

export function createThemeController() {
  const THEME_STORAGE_KEY = "whale-forms-theme";
  const DEFAULT_THEME = "dark";
  const THEMES = new Set(["light", "dark"]);

  return {
    applyTheme,
    bindThemeControls,
    readThemePreference,
    syncThemeControls
  };

  function bindThemeControls() {
    document.addEventListener("click", (event) => {
      const themeButton = event.target.closest("[data-theme-option]");
      if (!themeButton) {
        return;
      }

      applyTheme(themeButton.dataset.themeOption);
    });
  }

  function applyTheme(theme) {
    const nextTheme = THEMES.has(theme) ? theme : DEFAULT_THEME;
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      /* Storage failures should not block the UI. */
    }

    syncThemeControls();
  }

  function readThemePreference() {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return THEMES.has(savedTheme) ? savedTheme : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function syncThemeControls() {
    const activeTheme = document.body.dataset.theme || DEFAULT_THEME;

    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      const isActive = button.dataset.themeOption === activeTheme;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }
}
