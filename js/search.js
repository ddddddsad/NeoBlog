document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.querySelector('.search form');
    const searchInput = document.querySelector('.search input');
    const resultList = document.querySelector('.article-list ul');

    let articles = []; // 改为空数组，后续动态加载数据

    // 新增：加载所有分类的JSON数据
    async function loadArticlesData() {
        try {
            const categories = ['Astronomy', 'Physics', 'Explorations'];
            const allData = await Promise.all(
                categories.map(cat => 
                    // 当前路径
                    // 在深层页面可能失效，建议改为绝对路径
                    fetch(`/data/${cat}Articles.json`).then(res => res.json())
                )
            );
            
            // 合并所有文章数据并构建正确路径
            articles = allData.flatMap((data, index) => 
                data.map(article => ({
                    title: article.title,
                    // 修改后的路径生成逻辑（约第23行）
                    url: `Articles/${categories[index]}/${article.filename}`  // 与recent-articles.js保持统一路径格式
                }))
            );
        } catch (error) {
            console.error('Error loading articles:', error);
            resultList.innerHTML = '<li>Error loading articles</li>';
        }
    }

    // 修改后的搜索处理函数
    async function handleSearch(event) {
        event.preventDefault();
        await loadArticlesData(); // 确保数据已加载

        const query = searchInput.value.toLowerCase().trim();

        if (!query) {
            return; // 如果没有输入内容，则不进行任何操作
        }

        // 过滤匹配的文章
        const results = articles.filter(article => article.title.toLowerCase().includes(query));

        // 清空搜索结果列表
        resultList.innerHTML = '';

        // 如果有搜索结果
        if (results.length > 0) {
            results.forEach(article => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = article.url;
                link.textContent = article.title;
                listItem.appendChild(link);
                resultList.appendChild(listItem);
            });
        } else {
            resultList.innerHTML = '<li>No results found</li>';
        }
    }

    // 监听表单提交，获取所有搜索表单
    const searchForms = document.querySelectorAll('.search form');
    
    // 在表单提交事件监听处修改
    searchForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchValue = encodeURIComponent(searchInput.value.trim());
            // 跳转到搜索结果页并传递参数
            window.location.href = `SearchResultsPage.html?q=${searchValue}`;
        });
    });
    searchForm.addEventListener('submit', handleSearch);
});

// 在DOMContentLoaded事件内新增以下逻辑
if (window.location.pathname.includes('SearchResultsPage.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q')?.toLowerCase() || '';
    
    // 复用已有的数据加载和搜索逻辑
    loadArticlesData().then(() => {
        const results = articles.filter(article => 
            article.title.toLowerCase().includes(query)
        );
        
        const resultList = document.querySelector('.article-list ul');
        resultList.innerHTML = results.map(article => 
            `<li><a href="${article.url}">${article.title}</a></li>`
        ).join('') || '<li>No results found</li>';
    });
}
