/**
 * 从文章 HTML 中提取「第一个 h2 标题下、到下一个 h2 之前」的正文，生成列表摘要（纯文本）。
 */
(function () {
    var excerptCache = new Map();

    function resolveFetchBase() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            if (window.location.pathname.includes('/NeoBlog/')) {
                return '/NeoBlog/';
            }
            return '/';
        }
        return '';
    }

    function articleFetchUrl(article) {
        const rel = article.url
            ? article.url.replace(/^\//, '')
            : `Articles/${article.category}/${article.filename}`;
        return resolveFetchBase() + rel;
    }

    function parseFirstH2Section(doc) {
        const root = doc.querySelector('article.article-content') || doc.querySelector('.article-content');
        if (!root) return null;

        const firstH2 = root.querySelector('h2');
        if (firstH2) {
            const wrapper = doc.createElement('div');
            let el = firstH2.nextElementSibling;
            while (el && el.tagName !== 'H2') {
                const tag = el.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                    el = el.nextElementSibling;
                    continue;
                }
                wrapper.appendChild(el.cloneNode(true));
                el = el.nextElementSibling;
            }
            return wrapper;
        }

        const meta = root.querySelector('.meta-info');
        let p = meta ? meta.nextElementSibling : root.querySelector('h1')?.nextElementSibling;
        while (p && p.tagName !== 'P') {
            p = p.nextElementSibling;
        }
        if (p) {
            const w = doc.createElement('div');
            w.appendChild(p.cloneNode(true));
            return w;
        }
        return null;
    }

    function plainTextExcerpt(wrapper, maxLen) {
        if (!wrapper) return '';
        var text = wrapper.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return '';
        if (text.length > maxLen) {
            return text.slice(0, maxLen) + '…';
        }
        return text;
    }

    window.fetchArticleFirstH2Excerpt = async function (article, maxLen) {
        maxLen = maxLen === undefined ? 320 : maxLen;
        var cacheKey = article.category + '/' + article.filename;
        if (excerptCache.has(cacheKey)) {
            return plainTextExcerpt(
                { textContent: excerptCache.get(cacheKey) },
                maxLen
            );
        }
        try {
            var res = await fetch(articleFetchUrl(article));
            if (!res.ok) return '';
            var html = await res.text();
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var section = parseFirstH2Section(doc);
            var full = section ? section.textContent.replace(/\s+/g, ' ').trim() : '';
            excerptCache.set(cacheKey, full);
            return plainTextExcerpt(section, maxLen);
        } catch (e) {
            console.warn('[article-excerpt]', article.filename, e);
            return '';
        }
    };

    /**
     * 为已渲染的列表项填充 .article-list-excerpt（与 articles 数组顺序一致）。
     */
    window.fillArticleListExcerpts = async function (listElement, articles, maxLen) {
        if (!listElement || !articles || !articles.length) return;
        maxLen = maxLen === undefined ? 320 : maxLen;
        var items = listElement.querySelectorAll('li:not(.no-results)');
        await Promise.all(
            Array.from(articles).map(function (article, i) {
                return window.fetchArticleFirstH2Excerpt(article, maxLen).then(function (text) {
                    var excerptEl = items[i] && items[i].querySelector('.article-list-excerpt');
                    if (!excerptEl) return;
                    excerptEl.removeAttribute('data-loading');
                    excerptEl.textContent = text || '';
                    excerptEl.style.display = text ? '' : 'none';
                });
            })
        );
    };
})();
