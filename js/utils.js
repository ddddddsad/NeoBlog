// 通用工具类 - 提供统一的错误处理和常用功能
class Utils {
    // 缓存管理
    static cache = new Map();
    static cacheTimeout = 5 * 60 * 1000; // 5分钟

    // 加载所有文章数据
    static async loadAllArticles() {
        const cacheKey = 'allArticles';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const dataFiles = [
                'data/AstronomyArticles.json',
                'data/PhysicsArticles.json',
                'data/ExplorationsArticles.json'
            ];

            const responses = await Promise.all(
                dataFiles.map(file => this.fetchWithRetry(file))
            );

            const allArticles = responses
                .flatMap(data => data.articles || [])
                .map(article => ({
                    ...article,
                    date: new Date(article.date)
                }));

            this.setCache(cacheKey, allArticles);
            return allArticles;
        } catch (error) {
            throw new Error(`Failed to load articles: ${error.message}`);
        }
    }

    // 带重试的fetch
    static async fetchWithRetry(url, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.delay(delay * Math.pow(2, i)); // 指数退避
            }
        }
    }

    // 延迟函数
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 文章排序
    static sortArticlesByDate(articles) {
        return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 错误处理
    static handleError(container, message, error = null) {
        if (error) {
            console.error(`[Utils] ${message}:`, error);
        }

        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>😔 ${message}</p>
                    <button onclick="location.reload()" class="retry-btn">重试</button>
                </div>
            `;
        }
    }

    // 缓存管理
    static setCache(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    static getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    static clearCache() {
        this.cache.clear();
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 安全的DOM操作
    static safeQuerySelector(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return null;
        }
    }

    // 格式化日期
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        try {
            return new Date(date).toLocaleDateString('en-US', {
                ...defaultOptions,
                ...options
            });
        } catch (error) {
            console.warn('Invalid date format:', error);
            return 'Invalid Date';
        }
    }

    // 性能监控
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // 异步性能监控
    static async measureAsyncPerformance(name, asyncFn) {
        const start = performance.now();
        const result = await asyncFn();
        const end = performance.now();
        
        console.log(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// 导出到全局
window.Utils = Utils;
