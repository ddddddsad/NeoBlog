document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    
    try {
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        // 动态获取仓库基础路径
        const basePath = window.location.pathname.startsWith('/NeoBlog') 
            ? '/NeoBlog' 
            : '';

        const allData = await Promise.all(
            categories.map(cat => 
                fetch(`${basePath}/data/${cat}Articles.json`)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.url}`);
                        const contentType = res.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            throw new Error(`Invalid content-type: ${contentType}`);
                        }
                        return res.json();
                    })
                    .catch(error => {
                        console.error(`[${cat}]加载错误:`, error.message);
                        return [];
                    })
            )
        );
        
        // 提取并去重标签
        const allTags = [...new Set(
            allData.flatMap(data => 
                data.flatMap(article => article.tags)
            )
        )].sort(); // 按字母顺序排序
        
        // 生成标签列表
        tagsContainer.innerHTML = allTags.map(tag => `
            <li><a href="#" class="tag-link">${tag}</a></li>
        `).join('');
        
        // 折叠逻辑
        const maxTagsBeforeCollapse = 15;
        if(allTags.length > maxTagsBeforeCollapse) {
            tagsContainer.classList.add('collapsed');
            toggleButton.textContent = '[展开]';
        }
        
        toggleButton.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            tagsContainer.classList.toggle('collapsed');
            toggleButton.textContent = isCollapsed ? '[展开]' : '[折叠]';
        });
        
        // 删除所有与toggleButton相关的代码
        tagsContainer.style.maxHeight = 'none'; // 移除高度限制
    } catch (error) {
        console.error('Error loading tags:', error);
    }
});