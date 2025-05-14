document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    
    try {
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        const basePath = window.location.pathname.startsWith('/NeoBlog') 
            ? '/NeoBlog' 
            : '';

        // 简化数据获取逻辑
        const allData = await Promise.all(
            categories.map(cat => 
                fetch(`${basePath}/data/${cat}Articles.json`)
                    .then(res => res.ok ? res.json() : [])
                    .catch(() => [])
            )
        );

        // 优化标签处理
        const allTags = [...new Set(
            allData.flatMap(data => 
                data.flatMap(article => article.tags || [])
            )
        )].sort();

        // 简化标签渲染
        tagsContainer.innerHTML = allTags
            .map(tag => `<li><a href="#" class="tag-link">${tag}</a></li>`)
            .join('');
        
    } catch (error) {
        console.error('Error loading tags:', error);
    }
});