document.addEventListener('DOMContentLoaded', async () => {
    const tagsContainer = document.querySelector('.tags-list');
    if (!tagsContainer) return;
    
    try {
        let allTags;
        
        // 使用工具函数加载文章数据
        if (typeof Utils !== 'undefined') {
            const allArticles = await Utils.loadAllArticles();
            allTags = [...new Set(
                allArticles.flatMap(article => article.tags || [])
            )].sort();
        } else {
            // 降级处理：直接加载数据
            const categories = ['Astronomy', 'Physics', 'Explorations'];
            let basePath = '';
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                basePath = '/NeoBlog';
            }

            const allData = await Promise.all(
                categories.map(cat => {
                    const url = `${basePath}/data/${cat}Articles.json`;
                    console.log('Loading tags data from:', url);
                    return fetch(url)
                        .then(res => {
                            console.log(`Tags response for ${cat}:`, res.status, res.ok);
                            return res.ok ? res.json() : { articles: [] };
                        })
                        .catch(error => {
                            console.error(`Error loading tags for ${cat}:`, error);
                            return { articles: [] };
                        });
                })
            );

            allTags = [...new Set(
                allData.flatMap(categoryData => 
                    (categoryData.articles || [])
                     .flatMap(article => article.tags || [])
                )
            )].sort();
        }

        // 渲染标签
        tagsContainer.innerHTML = allTags
            .map(tag => `<li><a href="#" class="tag-link" data-tag="${tag}">${tag}</a></li>`)
            .join('');
        
        // 添加标签点击事件 - 实现标签搜索功能
        tagsContainer.querySelectorAll('.tag-link').forEach(tagLink => {
            tagLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const tag = e.target.dataset.tag || e.target.textContent;
                console.log('Tag clicked:', tag);
                
                // 执行标签搜索
                await performTagSearch(tag);
            });
        });
        
    } catch (error) {
        console.error('Error loading tags:', error);
        // 使用工具函数的统一错误处理
        if (typeof Utils !== 'undefined') {
            Utils.handleError(tagsContainer, 'Error loading tags');
        } else {
            tagsContainer.innerHTML = '<li class="error">Error loading tags</li>';
        }
    }
});

// 执行标签搜索的函数
async function performTagSearch(tag) {
    try {
        // 加载所有文章数据
        let allArticles;
        if (typeof Utils !== 'undefined') {
            allArticles = await Utils.loadAllArticles();
        } else {
            // 降级处理：直接加载数据
            const categories = ['Astronomy', 'Physics', 'Explorations'];
            let basePath = '';
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                basePath = '/NeoBlog';
            }

            const allData = await Promise.all(
                categories.map(cat => {
                    const url = `${basePath}/data/${cat}Articles.json`;
                    console.log('Loading search data from:', url);
                    return fetch(url)
                        .then(res => {
                            console.log(`Search response for ${cat}:`, res.status, res.ok);
                            return res.ok ? res.json() : { articles: [] };
                        })
                        .catch(error => {
                            console.error(`Error loading search data for ${cat}:`, error);
                            return { articles: [] };
                        });
                })
            );

            allArticles = allData.flatMap((data, index) => 
                (data.articles || []).map(article => ({
                    ...article,
                    category: categories[index],
                    url: `Articles/${categories[index]}/${article.filename}`,
                    date: new Date(article.date)
                }))
            );
        }

        // 筛选包含该标签的文章
        const results = allArticles.filter(article => 
            article.tags && article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );

        console.log(`Found ${results.length} articles with tag "${tag}":`, results);

        // 存储搜索结果到sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchQuery', tag);
        sessionStorage.setItem('searchType', 'tags');

        // 跳转到搜索结果页
        const currentPath = window.location.pathname;
        let targetPath = 'SearchResultsPage.html';
        
        // 检查是否在GitHub Pages环境
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // GitHub Pages环境，使用绝对路径
            if (currentPath.includes('/NeoBlog/')) {
                targetPath = '/NeoBlog/SearchResultsPage.html';
            } else {
                targetPath = '/SearchResultsPage.html';
            }
        } else {
            // 本地环境，使用相对路径
            if (currentPath.includes('/Articles/') || currentPath.includes('/AboutMe/')) {
                const pathSegments = currentPath.split('/').filter(segment => segment);
                const levelsUp = pathSegments.length - 1;
                targetPath = '../'.repeat(levelsUp) + 'SearchResultsPage.html';
            }
        }
        
        console.log('Jumping to search results:', targetPath);
        window.location.href = targetPath;

    } catch (error) {
        console.error('Error performing tag search:', error);
        // 可以在这里添加用户友好的错误提示
        alert(`搜索标签 "${tag}" 时出现错误，请稍后重试。`);
    }
}
