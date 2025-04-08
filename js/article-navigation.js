document.addEventListener("DOMContentLoaded", function () {
    const SCROLL_OFFSET = 150; // 滚动偏移量
    const toc = document.getElementById('toc');
    const headings = document.querySelectorAll('.article-content h2, .article-content h3');
    const tocLinks = [];
    const toggleArea = document.querySelector('.toggleArea');
    const articleNav = document.querySelector('.article-navigation');

    if (!toc || !toggleArea || !articleNav) return; // 空值检查

    // 生成目录导航
    function generateTOC() {
        const fragment = document.createDocumentFragment();
        headings.forEach((heading, index) => {
            const navHeading = document.createElement(heading.tagName.toLowerCase());
            const a = document.createElement('a');
            a.textContent = heading.textContent;
            a.href = `#section-${index}`;
            a.style.textDecoration = "none";
            heading.id = `section-${index}`;
            navHeading.appendChild(a);
            fragment.appendChild(navHeading);
        });
        toc.appendChild(fragment);
        tocLinks.push(...toc.querySelectorAll('a'));
    }

    // 处理导航链接点击事件
    function setupTOCLinks() {
        tocLinks.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                document.getElementById(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    // 处理滚动事件，高亮当前章节
    function setupScrollHighlight() {
        const sections = headings.length ? Array.from(headings).map((heading, index) => {
            const nextHeading = headings[index + 1];
            const sectionEnd = nextHeading ? nextHeading.offsetTop : document.body.scrollHeight;
            return {
                heading,
                sectionStart: heading.offsetTop,
                sectionEnd: sectionEnd
            };
        }) : [];

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(() => {
                const scrollPosition = window.scrollY + SCROLL_OFFSET;
                let currentSectionIndex = -1;
                sections.forEach((section, index) => {
                    if (scrollPosition >= section.sectionStart && scrollPosition < section.sectionEnd) {
                        currentSectionIndex = index;
                    }
                });
                tocLinks.forEach((link, index) => {
                    link.classList.toggle('active', index === currentSectionIndex);
                });
            });
        });
    }

    // 处理导航栏折叠/展开
    function setupToggle() {
        toggleArea.addEventListener('click', function () {
            articleNav.classList.toggle('collapsed');
        });
    }

    // 初始化
    generateTOC();
    setupTOCLinks();
    setupScrollHighlight();
    setupToggle();
});