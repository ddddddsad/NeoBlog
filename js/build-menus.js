// 构建脚本 - 自动生成所有菜单文件
class MenuBuilder {
    constructor() {
        this.categories = [
            { name: 'Astronomy', dataFile: '../../data/AstronomyArticles.json' },
            { name: 'Physics', dataFile: '../../data/PhysicsArticles.json' },
            { name: 'Explorations', dataFile: '../../data/ExplorationsArticles.json' }
        ];
    }

    // 生成HTML模板
    generateHTML(category) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${category.name} Articles</title>
    <link rel="stylesheet" href="../../css/MainStyle.css">
    <link rel="stylesheet" href="../../css/article-list.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="../../index.html">Home</a></li>
                <li><a href="../../AboutMe/aboutme.html">About Me</a></li>
                <li class="dropdown">
                    <a href="javascript:void(0);" class="dropbtn">Articles</a>
                    <ul class="dropdown-content">
                        <li><a href="../Astronomy/_AstronomyMenu.html">Astronomy</a></li>
                        <li><a href="../Physics/_PhysicsMenu.html">Physics</a></li>
                        <li><a href="../Explorations/_ExplorationsMenu.html">Explorations</a></li>
                    </ul>
                </li>
            </ul>
        </nav>
    </header>
    
    <div class="main-content">
        <section class="article-list">
            <h1>Articles: ${category.name}</h1>
            <ul id="article-list-container">
                <!-- 文章列表将由JavaScript动态生成 -->
            </ul>
        </section>

        <!-- 侧边栏 -->
        <aside class="sidebar">
            <!-- Search 模块 -->
            <div class="search-container">
                <h3>Search</h3>
                <div class="search">
                    <form action="../../SearchResultsPage.html" method="GET" id="search-form">
                        <!-- 搜索选项 -->
                        <div class="search-options">
                            <label class="search-option">
                                <input type="radio" name="searchType" value="title" checked>
                                <span>Title</span>
                            </label>
                            <label class="search-option">
                                <input type="radio" name="searchType" value="tags">
                                <span>Tags</span>
                            </label>
                            <label class="search-option">
                                <input type="radio" name="searchType" value="content">
                                <span>Content</span>
                            </label>
                        </div>
                        <div class="search-input-group">
                            <input type="text" name="search" id="search-input" placeholder="Search articles..." />
                            <button type="submit">Search</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Tags 模块 -->
            <div class="tags">
                <h3 class="tags-header">Tags</h3>
                <ul class="tags-list"></ul>
            </div>
        </aside>
    </div>
    
    <footer>
        <p>&copy; 2024 Personal Blog. All rights reserved.</p>
    </footer>
    
    <!-- Scripts -->
    <script src="../../js/script.js"></script>
    <script src="../../js/tags.js"></script>
    <script src="../../js/search.js"></script>
    <script src="../../js/menu-template.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS_HTML" async></script>
    
    <!-- 配置和初始化 -->
    <script>
        const CATEGORY_CONFIG = {
            category: '${category.name}',
            dataFile: '${category.dataFile}'
        };
        
        document.addEventListener('DOMContentLoaded', function() {
            new MenuTemplate(CATEGORY_CONFIG.category, CATEGORY_CONFIG.dataFile);
        });
    </script>
</body>
</html>`;
    }

    // 生成所有菜单文件
    generateAll() {
        this.categories.forEach(category => {
            const html = this.generateHTML(category);
            const filename = `../Articles/${category.name}/_${category.name}Menu.html`;
            
            // 在实际环境中，这里会写入文件
            console.log(`Generated ${filename}`);
            console.log('HTML content length:', html.length);
        });
    }

    // 验证现有文件
    validateExisting() {
        this.categories.forEach(category => {
            const filename = `../Articles/${category.name}/_${category.name}Menu.html`;
            console.log(`Checking ${filename}...`);
            // 这里可以添加文件验证逻辑
        });
    }
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
    const builder = new MenuBuilder();
    builder.generateAll();
    builder.validateExisting();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuBuilder;
}
