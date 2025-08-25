// 文章管理类 - 解决代码重复和性能问题
class ArticleManager {
    constructor() {
        this.articlesCache = new Map(); // 使用Map进行缓存
        this.containers = {
            articleList: document.querySelector('#articles-container'),
            recentArticles: document.getElementById('recent-articles')
        };
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
    }

    // 初始化
    async init() {
        if (this.shouldSkipRendering()) return;
        if (!this.hasValidContainers()) return;

        try {
            await this.loadArticles();
            this.renderRecentArticles();
            this.renderArticleList();
            this.initPagination();
        } catch (error) {
            this.handleError(error, 'Failed to initialize articles');
        }
    }

    // 检查是否应该跳过渲染
    shouldSkipRendering() {
        return window.location.pathname.includes('SearchResultsPage');
    }

    // 检查是否有有效的容器
    hasValidContainers() {
        return this.containers.articleList || this.containers.recentArticles;
    }

    // 加载文章数据（带缓存）
    async loadArticles() {
        const cacheKey = 'allArticles';
        const cached = this.articlesCache.get(cacheKey);
        
        if (cached && this.isCacheValid(cached.timestamp)) {
            this.allArticles = cached.data;
            return;
        }

        try {
            this.allArticles = await this.fetchArticlesData();
            this.articlesCache.set(cacheKey, {
                data: this.allArticles,
                timestamp: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to load articles: ${error.message}`);
        }
    }

    // 检查缓存是否有效（5分钟过期）
    isCacheValid(timestamp) {
        return Date.now() - timestamp < 5 * 60 * 1000;
    }

    // 获取文章数据
    async fetchArticlesData() {
        // 直接加载数据，不依赖外部工具类
        const dataFiles = [
            'data/AstronomyArticles.json',
            'data/PhysicsArticles.json',
            'data/ExplorationsArticles.json'
        ];

        const responses = await Promise.all(
            dataFiles.map(file => 
                fetch(file)
                    .then(r => r.json())
                    .catch(error => {
                        console.warn(`Failed to load ${file}:`, error);
                        return { articles: [] };
                    })
            )
        );

        return responses
            .flatMap(data => data.articles || [])
            .map(article => ({
                ...article,
                date: new Date(article.date)
            }))
            .sort((a, b) => b.date - a.date);
    }

    // 渲染最近文章
    renderRecentArticles() {
        if (!this.containers.recentArticles) return;

        const recentArticles = this.allArticles.slice(0, 6);
        this.containers.recentArticles.innerHTML = recentArticles
            .map(article => this.createRecentArticleHTML(article))
            .join('');

        this.setupTagClickEvents(this.containers.recentArticles);
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
    renderArticleList() {
        if (!this.containers.articleList) return;

        this.totalPages = Math.ceil(this.allArticles.length / this.itemsPerPage);
        this.renderPage(this.currentPage);
    }

    // 渲染指定页面
    renderPage(page) {
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageArticles = this.allArticles.slice(startIndex, endIndex);

        this.containers.articleList.innerHTML = pageArticles
            .map(article => this.createArticleListItemHTML(article))
            .join('');

        this.updatePaginationInfo(page);
        this.setupTagClickEvents(this.containers.articleList);
    }

    // 创建文章列表项HTML
    createArticleListItemHTML(article) {
        return `
            <li>
                <a class="article-list-title" href="Articles/${article.category}/${article.filename}">
                    ${article.title}
                </a>
                <time datetime="${article.date.toISOString().split('T')[0]}">
                    ${this.formatDate(article.date)}
                </time>
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

    // 设置标签点击事件（统一处理，避免重复代码）
    setupTagClickEvents(container) {
        container.querySelectorAll('.article-list-tagsName').forEach(tagLink => {
            // 移除已存在的事件监听器，避免重复绑定
            tagLink.removeEventListener('click', this.handleTagClick);
            tagLink.addEventListener('click', this.handleTagClick.bind(this));
        });
    }

    // 处理标签点击事件
    async handleTagClick(e) {
        e.preventDefault();
        const tag = e.target.dataset.tag;
        
        try {
            if (typeof performTagSearch === 'function') {
                await performTagSearch(tag);
            } else {
                this.showUserMessage(`点击标签 "${tag}" 搜索功能暂不可用，请使用侧边栏的搜索功能。`);
            }
        } catch (error) {
            this.handleError(error, `Failed to perform tag search for "${tag}"`);
        }
    }

    // 更新分页信息
    updatePaginationInfo(page) {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${page} of ${this.totalPages}`;
        }

        this.updatePaginationButtons(page);
    }

    // 更新分页按钮状态
    updatePaginationButtons(page) {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= this.totalPages;
    }

    // 初始化分页
    initPagination() {
        if (!this.containers.articleList) return;

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
        
        const errorMessage = this.getUserFriendlyErrorMessage(error);
        
        [this.containers.articleList, this.containers.recentArticles].forEach(container => {
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

    // 获取用户友好的错误信息
    getUserFriendlyErrorMessage(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return '网络连接失败，请检查网络设置';
        }
        if (error.name === 'SyntaxError') {
            return '数据格式错误，请联系管理员';
        }
        return '加载文章时出现错误，请稍后重试';
    }

    // 显示用户消息
    showUserMessage(message, type = 'info') {
        // 创建临时消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `user-message user-message-${type}`;
        messageDiv.textContent = message;
        
        // 添加基本样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            background: ${type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffa726' : '#4ecdc4'};
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    // 清理缓存
    clearCache() {
        this.articlesCache.clear();
    }

    // 获取缓存统计信息
    getCacheStats() {
        return {
            size: this.articlesCache.size,
            keys: Array.from(this.articlesCache.keys())
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const articleManager = new ArticleManager();
        await articleManager.init();
        
        // 将实例暴露到全局，便于调试和手动操作
        window.articleManager = articleManager;
    } catch (error) {
        console.error('Failed to initialize ArticleManager:', error);
    }
});