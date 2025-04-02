document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    const toggleButton = document.querySelector('.toggle-tags');
    
    try {
        // 加载所有标签数据
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        // 修改第7行fetch路径为绝对路径
        const allData = await Promise.all(
            categories.map(cat => 
                fetch(`/data/${cat}Articles.json`).then(res => res.json())
            )
        );
        
        // 提取并去重标签
        const allTags = [...new Set(
            allData.flatMap(data => 
                data.flatMap(article => article.tags)
            )
        )];
        
        // 生成标签列表
        tagsContainer.innerHTML = allTags.map(tag => `
            <li><a href="#" class="tag-link">${tag}</a></li>
        `).join('');
        
        // 折叠逻辑
        let isCollapsed = false;
        const maxTagsBeforeCollapse = 15;
        
        if(allTags.length > maxTagsBeforeCollapse) {
            tagsContainer.classList.add('collapsed');
            toggleButton.textContent = '[展开]';
            
            toggleButton.addEventListener('click', () => {
                isCollapsed = !isCollapsed;
                tagsContainer.classList.toggle('collapsed');
                toggleButton.textContent = isCollapsed ? '[展开]' : '[折叠]';
            });
        } else {
            toggleButton.remove();
        }
    } catch (error) {
        console.error('Error loading tags:', error);
        tagsContainer.innerHTML = '<li>Error loading tags</li>';
    }
});