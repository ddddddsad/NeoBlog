/**
 * Modern（默认）：沿用 data-theme 日夜主题
 * Classic：Windows 95 风格，隐藏日夜切换
 */
const UIMODE_STORAGE_KEY = 'uiMode';

function injectClassicStylesheet() {
    if (document.getElementById('classic-win94-css')) return;
    const main = document.querySelector('link[href*="MainStyle"]');
    if (!main) return;
    const href = main.href.replace(/MainStyle\.css/i, 'classic-win94.css');
    const link = document.createElement('link');
    link.id = 'classic-win94-css';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function injectNavChrome() {
    const nav = document.querySelector('header nav');
    if (!nav) return;
    nav.classList.add('site-nav');
    const ul = nav.querySelector('ul');
    if (!ul) return;
    ul.classList.add('nav-menu');

    if (!document.getElementById('ui-mode-toggle')) {
        const left = document.createElement('div');
        left.className = 'nav-left';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'ui-mode-toggle';
        btn.className = 'ui-mode-toggle-btn';
        btn.setAttribute('aria-label', '切换 Modern / Classic 界面');
        left.appendChild(btn);
        nav.insertBefore(left, ul);
    }

    if (!document.getElementById('nav-actions')) {
        const actions = document.createElement('div');
        actions.id = 'nav-actions';
        actions.className = 'nav-actions';
        nav.appendChild(actions);
    }
}

class UIModeManager {
    constructor() {
        this.mode = this.readStoredMode();
    }

    readStoredMode() {
        const v = localStorage.getItem(UIMODE_STORAGE_KEY);
        return v === 'classic' ? 'classic' : 'modern';
    }

    saveMode(mode) {
        localStorage.setItem(UIMODE_STORAGE_KEY, mode);
    }

    applyMode(mode) {
        this.mode = mode;
        this.saveMode(mode);
        document.documentElement.setAttribute('data-ui-mode', mode);
        this.updateButtonLabel();
        this.updateThemeToggleVisibility();
        window.dispatchEvent(new CustomEvent('uimodechange', { detail: { mode } }));
    }

    toggle() {
        this.applyMode(this.mode === 'modern' ? 'classic' : 'modern');
    }

    updateButtonLabel() {
        const btn = document.getElementById('ui-mode-toggle');
        if (!btn) return;
        if (this.mode === 'modern') {
            btn.textContent = 'Classic';
            btn.title = '切换为 Windows 95 风格';
        } else {
            btn.textContent = 'Modern';
            btn.title = '切换为现代界面（含日夜主题）';
        }
    }

    updateThemeToggleVisibility() {
        const container = document.querySelector('#nav-actions .theme-toggle-container');
        if (!container) return;
        container.style.display = this.mode === 'modern' ? '' : 'none';
    }

    init() {
        injectClassicStylesheet();
        injectNavChrome();
        this.applyMode(this.mode);
        const btn = document.getElementById('ui-mode-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.uiModeManager = new UIModeManager();
    window.uiModeManager.init();
});
