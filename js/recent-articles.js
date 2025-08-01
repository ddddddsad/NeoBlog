document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 修复1：添加容器存在性检查
        const containers = {
            articleList: document.querySelector('.article-list ul'),
            recentArticles: document.getElementById('recent-articles')
        };
        
        if (!containers.articleList && !containers.recentArticles) return;

        // 修复2：统一数据加载逻辑
        const responses = await Promise.all([
            fetch('data/AstronomyArticles.json').then(r => r.json()),
            fetch('data/PhysicsArticles.json').then(r => r.json()),
            fetch('data/ExplorationsArticles.json').then(r => r.json())
        ]);

        // 合并文章数据并排序
        const allArticles = responses.flatMap(
            (data, index) => data.articles?.map(a => ({ 
                ...a,
                date: new Date(a.date) 
            })) || []
        ).sort((a, b) => b.date - a.date);

        // 首页最新文章渲染
        if (containers.recentArticles) {
            containers.recentArticles.innerHTML = allArticles
                .slice(0, 6)
                .map(article => `
                    <div class="recent-article">
                        <a href="/Articles/${article.category}/${article.filename}">
                            ${article.title}
                        </a>
                        <span class="meta">
                            ${article.date.toLocaleDateString()} • ${article.category}
                        </span>
                    </div>
                `).join('');
        }

        // 文章列表页渲染（Astronomy专用）
        if (containers.articleList) {
            // 移除切片保留全部文章
            containers.articleList.innerHTML = allArticles
                .filter(a => a.category === 'Astronomy') // 添加分类过滤
                .map(article => `
                    <li>
                        <a class="article-list-title" href="Articles/${article.category}/${article.filename}">
                            ${article.title}
                        </a>
                        <time datetime="${article.date.toISOString().split('T')[0]}">
                            ${article.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                        <div>
                            <span class="article-list-tag">Tags: </span>
                            ${article.tags.map(tag => `
                                <a class="article-list-tagsName" href="#">${tag}</a>
                            `).join(', ')}
                        </div>
                    </li>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        // 统一的错误处理
        [containers.articleList, containers.recentArticles].forEach(container => {
            if (container) container.innerHTML = '<li>Error loading articles</li>';
        });
    }
});