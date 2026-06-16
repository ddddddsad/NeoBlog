// 标签加载与渲染
document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    if (!tagsContainer) return;

    try {
        const allTags = await BlogAPI.loadAllTags();

        tagsContainer.innerHTML = allTags
            .map(tag => `<li><a href="#" class="tag-link" data-tag="${tag}">${tag}</a></li>`)
            .join('');

        tagsContainer.querySelectorAll('.tag-link').forEach(tagLink => {
            tagLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const tag = e.target.dataset.tag || e.target.textContent;
                await performTagSearch(tag);
            });
        });

    } catch (error) {
        console.error('Error loading tags:', error);
        tagsContainer.innerHTML = '<li class="error">Error loading tags</li>';
    }
});

// 执行标签搜索
async function performTagSearch(tag) {
    try {
        const allArticles = await BlogAPI.loadAllArticles();

        const results = allArticles.filter(article =>
            article.tags && article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );

        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchQuery', tag);
        sessionStorage.setItem('searchType', 'tags');

        const currentPath = window.location.pathname;
        let targetPath = 'SearchResultsPage.html';

        if (BlogAPI.BASE) {
            targetPath = BlogAPI.BASE + '/SearchResultsPage.html';
        } else if (currentPath.includes('/Articles/') || currentPath.includes('/AboutMe/')) {
            const pathSegments = currentPath.split('/').filter(segment => segment);
            const levelsUp = pathSegments.length - 1;
            targetPath = '../'.repeat(levelsUp) + 'SearchResultsPage.html';
        }

        window.location.href = targetPath;

    } catch (error) {
        console.error('Error performing tag search:', error);
        const message = document.createElement('div');
        message.textContent = `搜索标签 "${tag}" 时出现错误，请稍后重试。`;
        message.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;background:#ff6b6b;color:#fff;border-radius:8px;z-index:10000;max-width:300px;';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
}
