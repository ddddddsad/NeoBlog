// 工具函数集合
const Utils = {
    // 统一的路径处理
    getBasePath() {
        return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
            ? '/NeoBlog' 
            : '';
    },
    
    getDataUrl(category) {
        return `${this.getBasePath()}/data/${category}Articles.json`;
    },
    
    // 统一的错误处理
    handleError(container, message = 'Error loading content') {
        if (container) {
            container.innerHTML = `<li class="error">${message}</li>`;
        }
    },
    
    // 文章数据加载
    async loadAllArticles() {
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        
        try {
            const allData = await Promise.all(
                categories.map(cat => 
                    fetch(this.getDataUrl(cat))
                        .then(res => res.ok ? res.json() : { articles: [] })
                        .catch(() => ({ articles: [] }))
                )
            );
            
            return allData.flatMap((data, index) => 
                (data.articles || []).map(article => ({
                    ...article,
                    category: categories[index],
                    url: `Articles/${categories[index]}/${article.filename}`,
                    date: new Date(article.date)
                }))
            );
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
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
        window.onscroll = Utils.debounce(() => UI.stickyHeader());
    },

    // 处理粘性头部的逻辑，当页面滚动到一定位置时，添加 'sticky' 类
    stickyHeader() {
        const header = document.querySelector("header");
        if (!header) return;
        
        const sticky = header.offsetTop;
        if (window.pageYOffset > sticky) {
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }
    },

    // 初始化下拉菜单的显示/隐藏逻辑
    initDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        if (!dropdown || !dropdownContent) return;
        
        dropdown.onclick = (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('show');
        };
    
        window.onclick = (event) => {
            if (!event.target.closest('.dropdown') && dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        };
    },

    // 初始化导航到 Astronomy 文章页面的逻辑
    initAstronomyNavigation() {
        const astronomyLink = document.querySelector('.load-astronomy');
        if (astronomyLink) {
            astronomyLink.onclick = (event) => {
                event.preventDefault();
                window.location.href = './Articles/Astronomy/_AstronomyMenu.html';
            };
        }
    },

    // 初始化导航到 Physics 文章页面的逻辑
    initPhysicsNavigation() {
        const physicsLink = document.querySelector('.load-physics');
        if (physicsLink) {
            physicsLink.onclick = (event) => {
                event.preventDefault();
                window.location.href = './Articles/Physics/_PhysicsMenu.html';
            };
        }
    },

    // 初始化导航到 Essays 文章页面的逻辑
    initEssayNavigation() {
        const essayLink = document.querySelector('.load-essays');
        if (essayLink) {
            essayLink.onclick = (event) => {
                event.preventDefault();
                window.location.href = './Articles/Essays/EssaysMenu.html';
            };
        }
    }
};

// 等待 DOM 完全加载后再初始化功能模块
document.addEventListener('DOMContentLoaded', () => {
    UI.initStickyHeader();
    UI.initDropdown();
    UI.initAstronomyNavigation();
    UI.initPhysicsNavigation();
    UI.initEssayNavigation();
});

// 页面跳转过渡效果
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // 跳过外部链接、邮件链接、带有target="_blank"的链接和锚点链接
        if (!link.hash && 
            !link.href.startsWith('http') && 
            !link.href.startsWith('mailto:') && 
            !link.href.startsWith('tel:') &&
            link.target !== '_blank' &&
            !link.hasAttribute('onclick')) {
            
            document.body.classList.add('page-leave');
            setTimeout(() => {
                window.location = link.href;
            }, 400);
        }
    });
});
