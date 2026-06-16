// 通用菜单模板 - 使用统一的 BlogAPI
class MenuTemplate {
    constructor(category, dataFile) {
        this.category = category;
        this.dataFile = dataFile;
        this.init();
    }

    init() {
        this.loadArticles();
    }

    async loadArticles() {
        try {
            const articles = await BlogAPI.loadCategoryArticles(this.category);
            this.renderArticles(articles);
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
            const excerpt = article.excerpt || '';
            li.innerHTML = `
                <a class="article-list-title" href="${article.filename}">${article.title}</a>
                <time datetime="${article.date.toISOString().split('T')[0]}">${this.formatDate(article.date)}</time>
                ${excerpt ? `<p class="article-list-excerpt">${excerpt}</p>` : ''}
                <div>
                    <span class="article-list-tag">Tags: </span>
                    ${article.tags.map(tag =>
                        `<a class="article-list-tagsName" href="#" data-tag="${tag}">${tag}</a>`
                    ).join(', ')}
                </div>
            `;
            container.appendChild(li);
        });

        this.setupTagClickEvents();
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setupTagClickEvents() {
        document.querySelectorAll('.article-list-tagsName').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const tag = link.dataset.tag;
                if (typeof performTagSearch === 'function') {
                    await performTagSearch(tag);
                } else {
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
