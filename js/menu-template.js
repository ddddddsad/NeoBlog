// 通用菜单模板 - 解决重复代码问题
class MenuTemplate {
    constructor(category, dataFile) {
        this.category = category;
        this.dataFile = dataFile;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadArticles();
        this.setupSearch();
        this.setupTags();
    }

    setupNavigation() {
        // 导航栏高亮当前分类
        const currentNavItem = document.querySelector(`a[href*="${this.category}"]`);
        if (currentNavItem) {
            currentNavItem.parentElement.classList.add('active');
        }
    }

    async loadArticles() {
        try {
            const response = await fetch(this.dataFile);
            const data = await response.json();
            
            // 排序文章（按日期降序）
            const sortedArticles = data.articles.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            this.renderArticles(sortedArticles);
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showError();
        }
    }

    renderArticles(articles) {
        const container = document.getElementById('article-list-container');
        if (!container) return;

        container.innerHTML = '';
        
        articles.forEach(article => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a class="article-list-title" href="${article.filename}">${article.title}</a>
                <time datetime="${article.date}">${this.formatDate(article.date)}</time>
                <div>
                    <span class="article-list-tag">Tags: </span>
                    ${article.tags.map(tag => 
                        `<a class="article-list-tagsName" href="#" data-tag="${tag}">${tag}</a>`
                    ).join(', ')}
                </div>
            `;
            container.appendChild(li);
        });

        // 添加标签点击事件
        this.setupTagClickEvents();
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    setupSearch() {
        const searchForm = document.getElementById('search-form');
        if (!searchForm) return;

        // 如果全局 handleSearch 已在其他脚本中绑定，这里不再绑定，避免重复提交
        if (typeof handleSearch === 'function') {
            return;
        }

        // 回退：本地处理提交（与全局逻辑保持一致）
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'title';
            
            if (searchInput && searchInput.value.trim()) {
                const searchParams = new URLSearchParams({
                    search: searchInput.value.trim(),
                    searchType
                });
                window.location.href = `../../SearchResultsPage.html?${searchParams.toString()}`;
            }
        });
    }

    setupTags() {
        // 标签功能由 tags.js 处理
        if (typeof setupTags === 'function') {
            setupTags();
        }
    }

    setupTagClickEvents() {
        const tagLinks = document.querySelectorAll('.article-list-tagsName');
        tagLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const tag = link.dataset.tag;
                console.log('Tag clicked in article list:', tag);
                
                // 如果全局的标签搜索函数存在，使用它
                if (typeof performTagSearch === 'function') {
                    await performTagSearch(tag);
                } else {
                    // 否则显示提示信息
                    alert(`点击标签 "${tag}" 搜索功能暂不可用，请使用侧边栏的搜索功能。`);
                }
            });
        });
    }

    showError() {
        const container = document.getElementById('article-list-container');
        if (container) {
            container.innerHTML = `
                <li class="error-message">
                    <p>Failed to load articles. Please try again later.</p>
                </li>
            `;
        }
    }
}

// 导出类供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuTemplate;
}
