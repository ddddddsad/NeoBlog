/**
 * BlogAPI — 统一数据加载模块
 * 所有文章数据的唯一入口，消除各处重复的 fetch 逻辑。
 */
const BlogAPI = (() => {
    const CATEGORIES = ['Astronomy', 'Physics', 'Explorations'];

    const BASE = (() => {
        const host = window.location.hostname;
        return (host !== 'localhost' && host !== '127.0.0.1') ? '/NeoBlog' : '';
    })();

    /** 获取某个分类的 data URL */
    function dataUrl(category) {
        return `${BASE}/data/${category}Articles.json`;
    }

    /** 单分类数据（原始 JSON，含 excerpt） */
    async function loadCategoryArticles(category) {
        const res = await fetch(dataUrl(category));
        if (!res.ok) throw new Error(`Failed to load ${category} articles`);
        const data = await res.json();
        return (data.articles || []).map(a => ({
            ...a,
            category,
            date: new Date(a.date)
        })).sort((a, b) => b.date - a.date);
    }

    /** 全站文章（带 url、按日期降序） */
    async function loadAllArticles() {
        const results = await Promise.all(
            CATEGORIES.map(cat =>
                fetch(dataUrl(cat))
                    .then(r => r.ok ? r.json() : { articles: [] })
                    .catch(() => ({ articles: [] }))
            )
        );
        return results.flatMap((data, i) =>
            (data.articles || []).map(a => ({
                ...a,
                category: CATEGORIES[i],
                url: `Articles/${CATEGORIES[i]}/${a.filename}`,
                date: new Date(a.date)
            }))
        ).sort((a, b) => b.date - a.date);
    }

    /** 收集全站唯一标签 */
    async function loadAllTags() {
        const articles = await loadAllArticles();
        return [...new Set(articles.flatMap(a => a.tags || []))].sort();
    }

    return { loadAllArticles, loadCategoryArticles, loadAllTags, BASE };
})();
