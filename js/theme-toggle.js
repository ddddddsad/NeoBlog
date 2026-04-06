// 主题切换功能
class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    // 初始化主题
    init() {
        this.applyTheme(this.theme);
        this.createToggleButton();
        this.setupEventListeners();
        window.addEventListener('uimodechange', () => this.syncUiModeVisibility());
    }

    // 获取系统主题偏好
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // 从localStorage获取存储的主题
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    // 保存主题到localStorage
    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // 应用主题
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        this.saveTheme(theme);
    }

    // 切换主题
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.updateButtonIcon(newTheme);
    }

    // 创建切换按钮
    createToggleButton() {
        // 检查按钮是否已存在
        if (document.getElementById('theme-toggle-btn')) {
            return;
        }

        const header = document.querySelector('header nav');
        if (!header) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle-btn';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', '切换主题');
        toggleBtn.setAttribute('title', '切换主题');
        
        // 添加图标
        const icon = document.createElement('i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        toggleBtn.appendChild(icon);

        const wrap = document.createElement('div');
        wrap.className = 'theme-toggle-container';
        wrap.appendChild(toggleBtn);

        const navActions = document.getElementById('nav-actions');
        const navList = header.querySelector('ul');
        if (navActions) {
            navActions.appendChild(wrap);
        } else if (navList) {
            const li = document.createElement('li');
            li.className = 'theme-toggle-container';
            li.appendChild(toggleBtn);
            navList.appendChild(li);
        }

        this.updateButtonIcon(this.theme);
        this.syncUiModeVisibility();
    }

    syncUiModeVisibility() {
        const container = document.querySelector('#nav-actions .theme-toggle-container');
        if (!container || !window.uiModeManager) return;
        container.style.display = window.uiModeManager.mode === 'modern' ? '' : 'none';
    }

    // 更新按钮图标
    updateButtonIcon(theme) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;

        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-toggle-btn')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // 如果用户没有手动设置过主题，则跟随系统
                if (!localStorage.getItem('theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                    this.updateButtonIcon(this.theme);
                }
            });
        }
    }
}

// 页面加载完成后初始化主题管理器
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

