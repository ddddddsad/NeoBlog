// 搜索处理函数
async function handleSearch(event) {
    event.preventDefault();

    const searchInput = document.querySelector('#search-input');
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'title';

    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    const articlesCache = await BlogAPI.loadAllArticles();

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
            results = await searchInContent(articlesCache, query);
            break;

        default:
            results = articlesCache.filter(article => {
                const titleMatch = article.title.toLowerCase().includes(query);
                const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(query));
                const categoryMatch = article.category.toLowerCase().includes(query);
                return titleMatch || tagMatch || categoryMatch;
            });
    }

    // 存储结果到sessionStorage
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    sessionStorage.setItem('searchQuery', searchInput.value.trim());
    sessionStorage.setItem('searchType', searchType);

    // 跳转到搜索结果页
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
}

// 在文章内容中搜索
async function searchInContent(articles, query) {
    const results = [];

    for (const article of articles) {
        try {
            let articleUrl = `Articles/${article.category}/${article.filename}`;
            if (BlogAPI.BASE) {
                articleUrl = `${BlogAPI.BASE}/${articleUrl}`;
            }

            const response = await fetch(articleUrl);
            if (response.ok) {
                const htmlContent = await response.text();

                const textContent = htmlContent
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (textContent.toLowerCase().includes(query)) {
                    results.push(article);
                }
            }
        } catch (error) {
            console.warn(`Failed to search content in ${article.filename}:`, error);
            if (article.title.toLowerCase().includes(query) ||
                article.tags.some(tag => tag.toLowerCase().includes(query))) {
                results.push(article);
            }
        }
    }

    return results;
}

// 搜索结果页渲染函数
async function renderSearchResults() {
    try {
        const results = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
        const searchQuery = sessionStorage.getItem('searchQuery') || '';
        const searchType = sessionStorage.getItem('searchType') || 'title';

        const resultList = document.querySelector('.article-list ul') || document.querySelector('#article-list-container');
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
                    let articleUrl = article.url;
                    if (BlogAPI.BASE) {
                        articleUrl = `${BlogAPI.BASE}/${articleUrl}`;
                    }

                    const excerpt = article.excerpt || '';

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
                            ${excerpt ? `<p class="article-list-excerpt">${excerpt}</p>` : ''}
                            <div>
                                <span class="article-list-tag">Tags: </span>
                                ${article.tags.map(tag => `
                                    <a class="article-list-tagsName" href="#" data-tag="${tag}">${tag}</a>
                                `).join(', ')}
                            </div>
                        </li>
                    `;
                }).join('');

                // 标签点击事件
                document.querySelectorAll('.article-list-tagsName').forEach(tagLink => {
                    tagLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const tag = e.target.dataset.tag;
                        if (typeof performTagSearch === 'function') {
                            await performTagSearch(tag);
                        } else {
                            const msg = document.createElement('div');
                            msg.textContent = `点击标签 "${tag}" 搜索功能暂不可用，请使用侧边栏的搜索功能。`;
                            msg.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;background:#4ecdc4;color:#fff;border-radius:8px;z-index:10000;max-width:300px;';
                            document.body.appendChild(msg);
                            setTimeout(() => msg.remove(), 3000);
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
        form.addEventListener('submit', handleSearch);
    });

    // 搜索结果页渲染逻辑
    if (window.location.pathname.includes('SearchResultsPage')) {
        const hasSession = !!sessionStorage.getItem('searchResults');
        if (hasSession) {
            renderSearchResults();
            return;
        }

        const url = new URL(window.location.href);
        const query = (url.searchParams.get('search') || '').trim();
        const searchType = url.searchParams.get('searchType') || 'title';

        if (query) {
            const tempInput = document.getElementById('search-input') || document.createElement('input');
            tempInput.id = 'search-input';
            tempInput.value = query;
            if (!document.getElementById('search-input')) {
                document.body.appendChild(tempInput);
            }

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

            handleSearch(new Event('submit'));
        } else {
            renderSearchResults();
        }
    }
});
