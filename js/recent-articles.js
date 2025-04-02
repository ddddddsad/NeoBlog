document.addEventListener('DOMContentLoaded', async () => {
    const articleList = document.querySelector('.article-list ul');
    if (!articleList) return;

    try {
        // 加载所有分类的文章数据
        const categories = ['Astronomy', 'Physics', 'Explorations'];
        const allData = await Promise.all(
            categories.map(cat => 
                fetch(`data/${cat}Articles.json`)
                    .then(res => res.json())
            )
        );

        // 合并并排序文章数据
        const articles = allData.flatMap((data, index) => 
            data.map(article => ({
                ...article,
                category: categories[index],
                date: new Date(article.date)
            }))
        ).sort((a, b) => b.date - a.date)
         .slice(0, 6); // 显示最新6篇文章

        // 生成HTML结构
        articleList.innerHTML = articles.map(article => `
            <li>
                <a class="article-list-title" href="Articles/${article.category}/${article.filename}">
                    ${article.title}
                </a>
                <time datetime="${article.date.toISOString().split('T')[0]}">
                    ${article.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <div>
                    <span class="article-list-tag">Tags: </span>
                    ${article.tags.map(tag => `
                        <a class="article-list-tagsName" href="#">${tag}</a>
                    `).join(', ')}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading recent articles:', error);
        articleList.innerHTML = '<li>Error loading recent articles</li>';
    }
});