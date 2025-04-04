document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    const toggleButton = document.querySelector('.toggle-tags');
    let isCollapsed = true;
    
    try {
        // 加载所有标签数据
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        const allData = await Promise.all(
            categories.map(cat => 
                // 修改为绝对路径
                fetch(`/data/${cat}Articles.json`)
                    .then(res => res.json())
                    .catch(error => {
                        console.error(`Error loading ${cat} articles:`, error);
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
    } catch (error) {
        console.error('Error loading tags:', error);
        tagsContainer.innerHTML = '<li>Error loading tags</li>';
    }
});
