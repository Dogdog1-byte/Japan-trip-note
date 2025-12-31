/**
 * Theme Manager for Stitch My Japan Trips
 * Handles custom primary and background colors using CSS variables.
 */

const DEFAULT_THEME = {
    primary: '#2563EB',
    backgroundLight: '#eff6ff'
};

export function initTheme() {
    const primary = localStorage.getItem('theme_primary') || DEFAULT_THEME.primary;
    const bgLight = localStorage.getItem('theme_background_light') || DEFAULT_THEME.backgroundLight;

    applyTheme(primary, bgLight);
}

export function applyTheme(primary, bgLight) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--background-light-color', bgLight);

    // Also save to localStorage
    localStorage.setItem('theme_primary', primary);
    localStorage.setItem('theme_background_light', bgLight);
}

export function getTheme() {
    return {
        primary: localStorage.getItem('theme_primary') || DEFAULT_THEME.primary,
        backgroundLight: localStorage.getItem('theme_background_light') || DEFAULT_THEME.backgroundLight
    };
}

// Auto-init on import
initTheme();
