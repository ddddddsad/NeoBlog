document.addEventListener("DOMContentLoaded", function () {
    const toc = document.getElementById('toc');
    const headings = document.querySelectorAll('.article-content h2, .article-content h3');
    const tocLinks = [];
    const toggleArea = document.querySelector('.toggleArea');
    const articleNav = document.querySelector('.article-navigation');

    if (!toc || !toggleArea || !articleNav) return;

    // 动态计算 header + 面包屑的总高度作为偏移量
    function getStickyOffset() {
        const header = document.querySelector('header');
        const breadcrumb = document.querySelector('.breadcrumb');
        let offset = 0;
        if (header) offset += header.getBoundingClientRect().height;
        if (breadcrumb) offset += breadcrumb.getBoundingClientRect().height;
        return offset + 8; // 额外留 8px 间距
    }

    let scrollOffset = 0;

    function updateOffset() {
        scrollOffset = getStickyOffset();
        if (articleNav) {
            articleNav.style.top = scrollOffset + 'px';
        }
    }

    updateOffset();
    // 窗口大小变化时重新计算
    window.addEventListener('resize', updateOffset);

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
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - scrollOffset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 处理滚动事件，高亮当前章节
    function setupScrollHighlight() {
        function buildSections() {
            return headings.length ? Array.from(headings).map((heading, index) => {
                const nextHeading = headings[index + 1];
                const sectionEnd = nextHeading ? nextHeading.offsetTop - 50 : document.body.scrollHeight;
                return {
                    heading,
                    sectionStart: heading.offsetTop - scrollOffset,
                    sectionEnd: sectionEnd
                };
            }) : [];
        }

        let sections = buildSections();

        // 窗口变化时重建 section 数据
        window.addEventListener('resize', () => {
            updateOffset();
            sections = buildSections();
        });

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(() => {
                const scrollPosition = window.scrollY;
                let currentSectionIndex = -1;

                sections.forEach((section, index) => {
                    if (scrollPosition >= section.sectionStart && scrollPosition < section.sectionEnd) {
                        currentSectionIndex = index;
                    }
                });

                // 如果滚动到页面底部，高亮最后一个章节
                if (currentSectionIndex === -1 && scrollPosition + window.innerHeight >= document.body.scrollHeight - 100) {
                    currentSectionIndex = sections.length - 1;
                }

                // 如果滚动到页面顶部，高亮第一个章节
                if (currentSectionIndex === -1 && scrollPosition <= scrollOffset) {
                    currentSectionIndex = 0;
                }

                // 更新导航高亮状态
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
