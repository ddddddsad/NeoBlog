/**
 * 文章摘要回退模块。
 * 正常情况下摘要来自 JSON 的 excerpt 字段；
 * 仅当 excerpt 缺失时，才 fetch 文章 HTML 提取首个 h2 下的正文。
 */
(function () {
    var excerptCache = new Map();

    function articleFetchUrl(article) {
        var rel = article.url
            ? article.url.replace(/^\//, '')
            : 'Articles/' + article.category + '/' + article.filename;
        return BlogAPI.BASE + '/' + rel;
    }

    function parseFirstH2Section(doc) {
        var root = doc.querySelector('article.article-content') || doc.querySelector('.article-content');
        if (!root) return null;

        var firstH2 = root.querySelector('h2');
        if (firstH2) {
            var wrapper = doc.createElement('div');
            var el = firstH2.nextElementSibling;
            while (el && el.tagName !== 'H2') {
                var tag = el.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                    el = el.nextElementSibling;
                    continue;
                }
                wrapper.appendChild(el.cloneNode(true));
                el = el.nextElementSibling;
            }
            return wrapper;
        }

        var meta = root.querySelector('.meta-info');
        var p = meta ? meta.nextElementSibling : root.querySelector('h1') ? root.querySelector('h1').nextElementSibling : null;
        while (p && p.tagName !== 'P') {
            p = p.nextElementSibling;
        }
        if (p) {
            var w = doc.createElement('div');
            w.appendChild(p.cloneNode(true));
            return w;
        }
        return null;
    }

    window.fetchArticleFirstH2Excerpt = async function (article, maxLen) {
        maxLen = maxLen === undefined ? 320 : maxLen;
        var cacheKey = article.category + '/' + article.filename;
        if (excerptCache.has(cacheKey)) {
            var cached = excerptCache.get(cacheKey);
            return cached.length > maxLen ? cached.slice(0, maxLen) + '…' : cached;
        }
        try {
            var res = await fetch(articleFetchUrl(article));
            if (!res.ok) return '';
            var html = await res.text();
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var section = parseFirstH2Section(doc);
            var full = section ? section.textContent.replace(/\s+/g, ' ').trim() : '';
            excerptCache.set(cacheKey, full);
            return full.length > maxLen ? full.slice(0, maxLen) + '…' : full;
        } catch (e) {
            console.warn('[article-excerpt]', article.filename, e);
            return '';
        }
    };

    /**
     * 仅为缺少 excerpt 的文章填充 .article-list-excerpt。
     */
    window.fillArticleListExcerpts = async function (listElement, articles, maxLen) {
        if (!listElement || !articles || !articles.length) return;
        maxLen = maxLen === undefined ? 320 : maxLen;
        var items = listElement.querySelectorAll('li:not(.no-results)');
        await Promise.all(
            Array.from(articles).map(function (article, i) {
                // 已有 excerpt 就不再 fetch
                if (article.excerpt) return Promise.resolve();
                return window.fetchArticleFirstH2Excerpt(article, maxLen).then(function (text) {
                    var excerptEl = items[i] && items[i].querySelector('.article-list-excerpt');
                    if (!excerptEl) return;
                    excerptEl.textContent = text || '';
                    excerptEl.style.display = text ? '' : 'none';
                });
            })
        );
    };
})();
