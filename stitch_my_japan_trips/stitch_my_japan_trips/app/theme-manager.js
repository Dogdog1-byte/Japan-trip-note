import { saveUserSettings, loadUserSettings } from './firebase-manager.js';

const DEFAULT_THEME = {
    primary: '#2563EB',
    backgroundLight: '#eff6ff'
};

export function initTheme() {
    const primary = localStorage.getItem('theme_primary') || DEFAULT_THEME.primary;
    const bgLight = localStorage.getItem('theme_background_light') || DEFAULT_THEME.backgroundLight;

    applyTheme(primary, bgLight);
}

export async function applyTheme(primary, bgLight, shouldSaveToFirebase = false) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--background-light-color', bgLight);

    // Also save to localStorage
    localStorage.setItem('theme_primary', primary);
    localStorage.setItem('theme_background_light', bgLight);

    if (shouldSaveToFirebase) {
        await saveUserSettings({ primary, backgroundLight: bgLight });
    }
}

export async function syncThemeWithFirebase() {
    const settings = await loadUserSettings();
    if (settings && settings.primary && settings.backgroundLight) {
        applyTheme(settings.primary, settings.backgroundLight, false);
        return true;
    }
    return false;
}

export function getTheme() {
    return {
        primary: localStorage.getItem('theme_primary') || DEFAULT_THEME.primary,
        backgroundLight: localStorage.getItem('theme_background_light') || DEFAULT_THEME.backgroundLight
    };
}

// Auto-init on import
initTheme();
