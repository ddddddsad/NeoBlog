document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.querySelector('.search form');
    const searchInput = document.querySelector('.search input');
    const resultList = document.querySelector('.article-list ul');

    let articles = []; // 改为空数组，后续动态加载数据

    // 新增：加载所有分类的JSON数据
    // 新增全局文章数据缓存
    let articlesCache = [];

    async function loadArticlesData() {
        try {
            const categories = ['Astronomy', 'Physics', 'Explorations'];
            const basePath = window.location.hostname === 'localhost' ? '' : '/NeoBlog';
            
            const allData = await Promise.all(
                categories.map(cat => 
                    fetch(`${basePath}/data/${cat}Articles.json`)
                        .then(res => {
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            return res.json();
                        })
                        .catch(error => {
                            console.error(`Error loading ${cat} articles:`, error);
                            return [];
                        })
                )
            );
            
            // 合并数据并添加分类信息
            articlesCache = allData.flatMap((data, index) => 
                data.map(article => ({
                    ...article,
                    category: categories[index],
                    url: `Articles/${categories[index]}/${article.filename}`
                }))
            );
        } catch (error) {
            console.error('Error loading articles:', error);
        }
    }

    // 优化搜索处理函数
    async function handleSearch(event) {
        event.preventDefault();
        await loadArticlesData();
        
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return;
    
        // 同时搜索标题和标签
        const results = articlesCache.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(query);
            const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(query));
            return titleMatch || tagMatch;
        });
    
        // 存储结果到sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        
        // 跳转到搜索结果页
        window.location.href = 'SearchResultsPage.html';
    }

    // 初始化搜索表单
    const searchForms = document.querySelectorAll('form[id="search-form"], form[action*="SearchResultsPage"]');
    searchForms.forEach(form => {
        form.addEventListener('submit', handleSearch);
    });

    // 新增搜索结果页渲染逻辑
    if (window.location.pathname.includes('SearchResultsPage')) {
        document.addEventListener('DOMContentLoaded', () => {
            const results = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
            const resultList = document.querySelector('.article-list ul');
            
            resultList.innerHTML = results.length > 0 
                ? results.map(article => `
                    <li>
                        <a href="${article.url}">${article.title}</a>
                        <div class="search-result-meta">
                            <span>分类：${article.category}</span>
                            <span>标签：${article.tags.join(', ')}</span>
                        </div>
                    </li>`
                  ).join('')
                : '<li>未找到相关结果</li>';
        });
    }
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


class ArticleSearcher {
  constructor() {
    this.index = null;
    this.articles = {};
    this.init().catch(console.error);
  }

  async init() {
    await this.loadIndex();
    this.setupSearchForm();
  }

  async loadIndex() {
    const response = await fetch('/search-index.json');
    const data = await response.json();
    
    this.index = lunr(function() {
      this.ref('id');
      this.field('title');
      this.field('content');
      this.field('tags');
      
      data.articles.forEach(article => {
        this.add(article);
        this.articles[article.id] = article;
      }, this);
    });
  }

  setupSearchForm() {
    document.querySelectorAll('.search-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = form.querySelector('input').value.trim();
        if (query) this.executeSearch(query);
      });
    });
  }

  executeSearch(query) {
    const results = this.index.search(`${query}~1`);
    this.displayResults(results);
  }

  displayResults(results) {
    const container = document.createElement('div');
    container.className = 'search-results';
    
    if (results.length) {
      results.forEach(result => {
        const article = this.articles[result.ref];
        const excerpt = this.createExcerpt(article.content);
        container.innerHTML += `
          <div class="search-result-item">
            <h4><a href="${article.url}">${article.title}</a></h4>
            <div class="excerpt">${excerpt}</div>
            <div class="meta">${article.tags.map(t => `<span>${t}</span>`).join('')}</div>
          </div>
        `;
      });
    } else {
      container.innerHTML = `<p class="no-results">未找到相关结果</p>`;
    }
    
    document.querySelector('.search-container').appendChild(container);
  }

  createExcerpt(content) {
    // 实现智能段落截取和关键词高亮
    // ... (限于篇幅此处省略具体实现)
  }
}

// 初始化搜索器
new ArticleSearcher();
