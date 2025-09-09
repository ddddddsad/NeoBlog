// 全局文章数据缓存
let articlesCache = [];

// 搜索处理函数
async function handleSearch(event) {
    event.preventDefault();
    
    const searchInput = document.querySelector('#search-input');
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'title';
    
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    console.log('Search query:', query, 'Search type:', searchType);
    
    // 使用工具函数加载文章数据
    if (typeof Utils !== 'undefined') {
        articlesCache = await Utils.loadAllArticles();
    } else {
        // 降级处理：直接加载数据
        articlesCache = await loadArticlesData();
    }
    
    console.log('Articles cache:', articlesCache);
    
    // 根据搜索类型进行不同的搜索
    let results = [];
    
    switch (searchType) {
        case 'title':
            results = articlesCache.filter(article => 
                article.title.toLowerCase().includes(query)
            );
            break;
            
        case 'tags':
            results = articlesCache.filter(article => 
                article.tags.some(tag => tag.toLowerCase().includes(query))
            );
            break;
            
        case 'content':
            // 对于内容搜索，我们需要加载文章的实际内容
            results = await searchInContent(articlesCache, query);
            break;
            
        default:
            // 默认搜索所有字段
            results = articlesCache.filter(article => {
                const titleMatch = article.title.toLowerCase().includes(query);
                const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(query));
                const categoryMatch = article.category.toLowerCase().includes(query);
                return titleMatch || tagMatch || categoryMatch;
            });
    }
    
    console.log('Search results:', results);

    // 存储结果到sessionStorage，保持原始大小写
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    sessionStorage.setItem('searchQuery', searchInput.value.trim());
    sessionStorage.setItem('searchType', searchType);
    
    // 修复：使用绝对路径跳转到搜索结果页
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
    
    console.log('Jumping to:', targetPath);
    window.location.href = targetPath;
}

// 新增：在文章内容中搜索
async function searchInContent(articles, query) {
    const results = [];
    
    for (const article of articles) {
        try {
            // 构建文章文件的URL
            let articleUrl = `Articles/${article.category}/${article.filename}`;
            
            // 在GitHub Pages环境中添加正确的路径前缀
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                if (window.location.pathname.includes('/NeoBlog/')) {
                    articleUrl = `/NeoBlog/${articleUrl}`;
                } else {
                    articleUrl = `/${articleUrl}`;
                }
            }
            
            console.log('Fetching article content from:', articleUrl);
            
            // 获取文章内容
            const response = await fetch(articleUrl);
            if (response.ok) {
                const htmlContent = await response.text();
                
                // 提取纯文本内容（移除HTML标签）
                const textContent = htmlContent
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签
                    .replace(/<[^>]+>/g, ' ') // 移除所有HTML标签
                    .replace(/\s+/g, ' ') // 合并多个空格
                    .trim();
                
                // 检查内容是否包含搜索词
                if (textContent.toLowerCase().includes(query)) {
                    results.push(article);
                }
            }
        } catch (error) {
            console.warn(`Failed to search content in ${article.filename}:`, error);
            // 如果内容搜索失败，至少检查标题和标签
            if (article.title.toLowerCase().includes(query) || 
                article.tags.some(tag => tag.toLowerCase().includes(query))) {
                results.push(article);
            }
        }
    }
    
    return results;
}

// 降级数据加载函数（当Utils不可用时使用）
async function loadArticlesData() {
    try {
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        
        let basePath = '';
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            basePath = '/NeoBlog';
        }
        
        const allData = await Promise.all(
            categories.map(cat => {
                const url = `${basePath}/data/${cat}Articles.json`;
                console.log('Loading data from:', url);
                return fetch(url)
                    .then(res => {
                        console.log(`Response for ${cat}:`, res.status, res.ok);
                        return res.ok ? res.json() : { articles: [] };
                    })
                    .catch(error => {
                        console.error(`Error loading ${cat}:`, error);
                        return { articles: [] };
                    });
            })
        );
        
        return allData.flatMap((data, index) => 
            (data.articles || []).map(article => ({
                ...article,
                category: categories[index],
                url: `Articles/${categories[index]}/${article.filename}`
            }))
        );
    } catch (error) {
        console.error('Error loading articles:', error);
        return [];
    }
}

// 搜索结果页渲染函数
async function renderSearchResults() {
    try {
        // 获取搜索结果、搜索查询和搜索类型
        const results = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
        const searchQuery = sessionStorage.getItem('searchQuery') || '';
        const searchType = sessionStorage.getItem('searchType') || 'title';
        
        console.log('RenderSearchResults - Results:', results);
        console.log('RenderSearchResults - Search query:', searchQuery);
        console.log('RenderSearchResults - Search type:', searchType);
        
        const resultList = document.querySelector('.article-list ul');
        const searchTitle = document.querySelector('.article-list h1');
        const typeText = {
            'title': 'titles',
            'tags': 'tags',
            'content': 'content'
        }[searchType] || 'all fields';
        
        if (searchTitle) {
            searchTitle.textContent = `Search Results for "${searchQuery}" in ${typeText}`;
        }
        
        if (resultList) {
            if (results.length > 0) {
                resultList.innerHTML = results.map(article => {
                    // 修复文章链接路径
                    let articleUrl = article.url;
                    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                        if (window.location.pathname.includes('/NeoBlog/')) {
                            articleUrl = `/NeoBlog/${articleUrl}`;
                        } else {
                            articleUrl = `/${articleUrl}`;
                        }
                    }
                    
                    return `
                        <li>
                            <a class="article-list-title" href="${articleUrl}">${article.title}</a>
                            <time datetime="${article.date}">
                                ${new Date(article.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </time>
                            <div>
                                <span class="article-list-tag">Tags: </span>
                                ${article.tags.map(tag => `
                                    <a class="article-list-tagsName" href="#" data-tag="${tag}">${tag}</a>
                                `).join(', ')}
                            </div>
                        </li>
                    `;
                }).join('');
                
                // 添加标签点击事件
                document.querySelectorAll('.article-list-tagsName').forEach(tagLink => {
                    tagLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const tag = e.target.dataset.tag;
                        console.log('Tag clicked in search results:', tag);
                        
                        // 如果全局的标签搜索函数存在，使用它
                        if (typeof performTagSearch === 'function') {
                            await performTagSearch(tag);
                        } else {
                            // 否则显示提示信息
                            alert(`点击标签 "${tag}" 搜索功能暂不可用，请使用侧边栏的搜索功能。`);
                        }
                    });
                });
            } else {
                resultList.innerHTML = `
                    <li class="no-results">
                        <p>No articles found matching "${searchQuery}" in ${typeText}.</p>
                        <p>Try different keywords or check your spelling.</p>
                    </li>
                `;
            }
        }
        
        // 清空sessionStorage
        sessionStorage.removeItem('searchResults');
        sessionStorage.removeItem('searchQuery');
        sessionStorage.removeItem('searchType');
        
    } catch (error) {
        console.error('Error rendering search results:', error);
        const resultList = document.querySelector('.article-list ul');
        if (resultList) {
            resultList.innerHTML = '<li class="error">Error loading search results. Please try again.</li>';
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化搜索表单
    const searchForms = document.querySelectorAll('form[id="search-form"], form[action*="SearchResultsPage"]');
    searchForms.forEach(form => {
        // 防止重复绑定
        form.addEventListener('submit', handleSearch, { once: false });
    });

    // 搜索结果页渲染逻辑
    if (window.location.pathname.includes('SearchResultsPage')) {
        // 1) sessionStorage 直出
        const hasSession = !!sessionStorage.getItem('searchResults');
        if (hasSession) {
            renderSearchResults();
            return;
        }

        // 2) 回退：解析 URL 查询参数，主动执行搜索
        const url = new URL(window.location.href);
        const query = (url.searchParams.get('search') || '').trim();
        const searchType = url.searchParams.get('searchType') || 'title';

        if (query) {
            // 构造一个临时表单元素以复用 handleSearch 逻辑
            const tempInput = document.getElementById('search-input') || document.createElement('input');
            tempInput.id = 'search-input';
            tempInput.value = query;
            if (!document.getElementById('search-input')) {
                document.body.appendChild(tempInput);
            }

            // 设置单选框
            const radioSelector = `input[name="searchType"][value="${searchType}"]`;
            let radio = document.querySelector(radioSelector);
            if (!radio) {
                radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'searchType';
                radio.value = searchType;
                radio.checked = true;
                document.body.appendChild(radio);
            } else {
                radio.checked = true;
            }

            // 直接调用处理逻辑（模拟提交）
            handleSearch(new Event('submit'));
        } else {
            // 没有参数，也没有 session，保持默认空列表标题
            renderSearchResults();
        }
    }
});
