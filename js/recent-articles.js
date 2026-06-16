// 文章管理类 - 使用统一的 BlogAPI
class ArticleManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
    }

    // 初始化
    async init() {
        if (this.shouldSkipRendering()) return;

        const articleList = document.querySelector('#articles-container');
        const recentArticles = document.getElementById('recent-articles');
        if (!articleList && !recentArticles) return;

        try {
            this.allArticles = await BlogAPI.loadAllArticles();
            this.renderRecentArticles();
            await this.renderArticleList();
            this.initPagination();
        } catch (error) {
            this.handleError(error, 'Failed to initialize articles');
        }
    }

    // 检查是否应该跳过渲染
    shouldSkipRendering() {
        return window.location.pathname.includes('SearchResultsPage');
    }

    // 渲染最近文章
    renderRecentArticles() {
        const container = document.getElementById('recent-articles');
        if (!container) return;

        const recentArticles = this.allArticles.slice(0, 6);
        container.innerHTML = recentArticles
            .map(article => this.createRecentArticleHTML(article))
            .join('');

        this.setupTagClickEvents(container);
    }

    // 创建最近文章HTML
    createRecentArticleHTML(article) {
        return `
            <div class="recent-article">
                <a href="Articles/${article.category}/${article.filename}">
                    ${article.title}
                </a>
                <span class="meta">
                    ${this.formatDate(article.date)} • ${article.category}
                </span>
                <div class="recent-article-tags">
                    ${this.createTagsHTML(article.tags)}
                </div>
            </div>
        `;
    }

    // 渲染文章列表
    async renderArticleList() {
        const container = document.querySelector('#articles-container');
        if (!container) return;

        this.totalPages = Math.ceil(this.allArticles.length / this.itemsPerPage);
        await this.renderPage(this.currentPage);
    }

    // 渲染指定页面
    async renderPage(page) {
        const container = document.querySelector('#articles-container');
        if (!container) return;

        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageArticles = this.allArticles.slice(startIndex, endIndex);

        container.innerHTML = pageArticles
            .map(article => this.createArticleListItemHTML(article))
            .join('');

        this.updatePaginationInfo(page);
        this.setupTagClickEvents(container);
    }

    // 创建文章列表项HTML（直接使用 JSON 中的 excerpt）
    createArticleListItemHTML(article) {
        const excerpt = article.excerpt || '';
        return `
            <li>
                <a class="article-list-title" href="Articles/${article.category}/${article.filename}">
                    ${article.title}
                </a>
                <time datetime="${article.date.toISOString().split('T')[0]}">
                    ${this.formatDate(article.date)}
                </time>
                ${excerpt ? `<p class="article-list-excerpt">${excerpt}</p>` : ''}
                <div>
                    <span class="article-list-tag">Tags: </span>
                    ${this.createTagsHTML(article.tags)}
                </div>
            </li>
        `;
    }

    // 创建标签HTML
    createTagsHTML(tags) {
        return tags.map(tag =>
            `<a class="article-list-tagsName" href="#" data-tag="${tag}">${tag}</a>`
        ).join(', ');
    }

    // 设置标签点击事件
    setupTagClickEvents(container) {
        container.querySelectorAll('.article-list-tagsName').forEach(tagLink => {
            tagLink.removeEventListener('click', this._tagHandler);
            tagLink.addEventListener('click', this._tagHandler);
        });
    }

    // 内部标签处理器
    _tagHandler(e) {
        e.preventDefault();
        const tag = e.target.dataset.tag;
        if (typeof performTagSearch === 'function') {
            performTagSearch(tag);
        } else {
            const msg = document.createElement('div');
            msg.textContent = `点击标签 "${tag}" 搜索功能暂不可用，请使用侧边栏的搜索功能。`;
            msg.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:8px;color:#fff;font-weight:500;z-index:10000;max-width:300px;background:#4ecdc4;box-shadow:0 4px 15px rgba(0,0,0,0.2);';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 3000);
        }
    }

    // 更新分页信息
    updatePaginationInfo(page) {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${page} of ${this.totalPages}`;
        }

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= this.totalPages;
    }

    // 初始化分页
    initPagination() {
        const container = document.querySelector('#articles-container');
        if (!container) return;

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }
    }

    // 跳转到指定页面
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderPage(page);
        }
    }

    // 格式化日期
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 统一错误处理
    handleError(error, context = '') {
        console.error(`[ArticleManager] ${context}:`, error);

        const errorMessage = error.name === 'TypeError' && error.message.includes('fetch')
            ? '网络连接失败，请检查网络设置'
            : '加载文章时出现错误，请稍后重试';

        document.querySelectorAll('#articles-container, #recent-articles').forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>😔 ${errorMessage}</p>
                        <button onclick="location.reload()" class="retry-btn">重试</button>
                    </div>
                `;
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const articleManager = new ArticleManager();
        await articleManager.init();
        window.articleManager = articleManager;
    } catch (error) {
        console.error('Failed to initialize ArticleManager:', error);
    }
});
