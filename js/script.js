// 工具函数集合
const Utils = {
    // 统一的路径处理
    getBasePath() {
        return BlogAPI.BASE;
    },

    // 统一的错误处理
    handleError(container, message = 'Error loading content') {
        if (container) {
            container.innerHTML = `<li class="error">${message}</li>`;
        }
    },

    // 文章排序
    sortArticlesByDate(articles, ascending = false) {
        return [...articles].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    },

    // 防抖函数
    debounce(func, delay = 100) {
        let debounceTimer;
        return function(...args) {
            const context = this;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }
};

// UI 对象包含初始化所有功能模块的方法
const UI = {
    // 初始化粘性头部，使用工具函数中的防抖
    initStickyHeader() {
        window.addEventListener('scroll', Utils.debounce(() => UI.stickyHeader()), { passive: true });
    },

    // 处理粘性头部的逻辑，当页面滚动到一定位置时，添加 'sticky' 类
    stickyHeader() {
        const header = document.querySelector("header");
        if (!header) return;

        const scrollY = window.pageYOffset;

        if (scrollY > 80) {
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }

        // Hero Banner 可见时，header 半透明融入
        if (scrollY < 80) {
            header.classList.add("header-transparent");
        } else {
            header.classList.remove("header-transparent");
        }
    },

    // 初始化下拉菜单的显示/隐藏逻辑
    initDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = document.querySelector('.dropdown-content');

        if (!dropdown || !dropdownContent) return;

        dropdown.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('show');
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.dropdown') && dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        });
    },

    // Hero Banner 鼠标视差位移效果
    initHeroParallax() {
        const hero = document.querySelector('.hero-banner');
        const heroImage = document.querySelector('.hero-image');
        const heroOverlay = document.querySelector('.hero-overlay');
        if (!hero || !heroImage) return;

        // 默认居中位置
        const defaultX = 50;
        const defaultY = 50;

        hero.addEventListener('mousemove', (e) => {
            // 仅展开状态下启用视差
            if (!hero.classList.contains('expanded')) return;

            const rect = hero.getBoundingClientRect();
            // 鼠标在 banner 内的相对位置 (0~1)
            const xPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const yPercent = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

            // 鼠标位置直接映射为 object-position：鼠标在下 → 视角在下
            const offsetX = xPercent * 100;
            const offsetY = yPercent * 100;

            heroImage.style.objectPosition = `${offsetX}% ${offsetY}%`;

            // 文字层同向微移，增强纵深感
            if (heroOverlay) {
                const tx = (xPercent - 0.5) * 14;
                const ty = (yPercent - 0.5) * 10;
                heroOverlay.style.transform = `translate(${tx}px, ${ty}px)`;
            }
        });

        hero.addEventListener('mouseleave', () => {
            // 平滑回到默认居中位置
            heroImage.style.objectPosition = `${defaultX}% ${defaultY}%`;
            if (heroOverlay) {
                heroOverlay.style.transform = 'translate(0, 0)';
            }
        });
    },

    // 面包屑导航自动生成
    initBreadcrumb() {
        const path = window.location.pathname;
        // 首页不生成面包屑
        if (path === '/' || path.endsWith('index.html') || path.endsWith('/NeoBlog/')) return;

        const base = BlogAPI.BASE;

        const crumbs = [{ label: '<span class="breadcrumb-icon">⌂</span>Home', url: base + '/index.html' }];

        const pathParts = path.replace(base, '').replace(/^\//, '').split('/').filter(Boolean);

        // 判断页面类型并构建面包屑
        if (path.includes('/AboutMe/')) {
            crumbs.push({ label: 'About Me', current: true });
        } else if (path.includes('/SearchResultsPage')) {
            crumbs.push({ label: 'Search Results', current: true });
        } else if (path.includes('/Articles/')) {
            // 取分类名（Articles 后的第一级目录）
            const articlesIdx = pathParts.indexOf('Articles');
            if (articlesIdx !== -1 && pathParts[articlesIdx + 1]) {
                const category = pathParts[articlesIdx + 1];
                // 判断是否是菜单页
                const isMenu = pathParts[pathParts.length - 1].startsWith('_') && pathParts[pathParts.length - 1].endsWith('Menu.html');
                crumbs.push({
                    label: category,
                    url: isMenu ? null : `${base}/Articles/${category}/_${category}Menu.html`,
                    current: isMenu
                });
                // 文章页：加当前文章标题
                if (!isMenu) {
                    const h1 = document.querySelector('.article-content h1, article h1, h1');
                    const title = h1 ? h1.textContent.trim() : pathParts[pathParts.length - 1].replace('.html', '');
                    crumbs.push({ label: title, current: true });
                }
            }
        }

        // 构建 HTML
        const html = '<nav class="breadcrumb" aria-label="Breadcrumb"><ol>' +
            crumbs.map(c => {
                if (c.current) {
                    return `<li><span class="breadcrumb-current">${c.label}</span></li>`;
                }
                if (c.url) {
                    return `<li><a href="${c.url}">${c.label}</a></li>`;
                }
                return `<li><span>${c.label}</span></li>`;
            }).join('') +
            '</ol></nav>';

        // 插入到 header 之后、main-content 之前
        const header = document.querySelector('header');
        const existing = document.querySelector('.breadcrumb');
        if (existing) existing.remove();
        if (header) {
            header.insertAdjacentHTML('afterend', html);
            // 动态设置面包屑 sticky top = header 实际高度
            const breadcrumb = document.querySelector('.breadcrumb');
            if (breadcrumb) {
                const headerHeight = header.getBoundingClientRect().height;
                breadcrumb.style.top = headerHeight + 'px';
            }
        }
    },

    // Hero 展开/收起切换
    initHeroToggle() {
        const hero = document.querySelector('.hero-banner');
        const toggle = document.querySelector('.hero-toggle');
        if (!hero || !toggle) return;

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            hero.classList.toggle('expanded');
        });

        // 折叠状态时点击横幅任意位置也可展开
        hero.addEventListener('click', (e) => {
            if (!hero.classList.contains('expanded') && e.target !== toggle) {
                hero.classList.add('expanded');
            }
        });
    }
};

// 等待 DOM 完全加载后再初始化功能模块
document.addEventListener('DOMContentLoaded', () => {
    UI.initStickyHeader();
    UI.initDropdown();
    UI.initHeroParallax();
    UI.initBreadcrumb();
    UI.initHeroToggle();
});
