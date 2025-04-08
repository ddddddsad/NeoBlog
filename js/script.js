// UI 对象包含初始化所有功能模块的方法
const UI = {
    // 初始化粘性头部，调用 debounceScroll 以提高滚动性能
    initStickyHeader() {
        // 建议修改（保持函数上下文）
        window.onscroll = UI.debounceScroll(() => UI.stickyHeader());
    },

    // 处理粘性头部的逻辑，当页面滚动到一定位置时，添加 'sticky' 类
    stickyHeader() {
        const header = document.querySelector("header");
        const sticky = header.offsetTop;
        if (window.pageYOffset > sticky) {
            header.classList.add("sticky"); // 滚动超过头部时，添加类使其粘性
        } else {
            header.classList.remove("sticky"); // 否则移除粘性类
        }
    },

    // 初始化下拉菜单的显示/隐藏逻辑
    initDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        dropdown.onclick = (event) => {
            event.stopPropagation(); // 阻止事件冒泡
            dropdownContent.classList.toggle('show');
        };
    
        window.onclick = (event) => {
            // 添加对下拉按钮的精确判断
            if (!event.target.closest('.dropdown') && dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        };
    },

// 修改后（保持正确上下文）
debounceScroll(func, delay = 100) {
    let debounceTimer;
    return function() {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context), delay);
    };
},

    // 初始化导航到 Astronomy 文章页面的逻辑
    initAstronomyNavigation() {
        const astronomyLink = document.querySelector('.load-astronomy');
        if (astronomyLink) {
            astronomyLink.onclick = (event) => {
                event.preventDefault(); // 阻止默认跳转行为
                window.location.href = './Articles/Astronomy/_AstronomyMenu.html'; // 跳转到天文学文章目录
            };
        }
    },

    // 初始化导航到 Physics 文章页面的逻辑
    initPhysicsNavigation() {
        const physicsLink = document.querySelector('.load-physics');
        if (physicsLink) {
            physicsLink.onclick = (event) => {
                event.preventDefault(); // 阻止默认跳转行为
                window.location.href = './Articles/Physics/_PhysicsMenu.html'; // 跳转到物理文章目录
            };
        }
    },

    // 初始化导航到 Essays 文章页面的逻辑
    initEssayNavigation() {
        const essayLink = document.querySelector('.load-essays');
        if (essayLink) {
            essayLink.onclick = (event) => {
                event.preventDefault(); // 阻止默认跳转行为
                window.location.href = './Articles/Essays/EssaysMenu.html'; // 跳转到随笔文章目录
            };
        }
    }
};

// 等待 DOM 完全加载后再初始化功能模块
document.addEventListener('DOMContentLoaded', () => {
    UI.initStickyHeader(); // 初始化粘性头部功能
    UI.initDropdown(); // 初始化下拉菜单功能
    UI.initAstronomyNavigation(); // 初始化天文学导航
    UI.initPhysicsNavigation(); // 初始化物理导航
    UI.initEssayNavigation(); // 初始化随笔导航
});

// 在现有导航逻辑中添加过渡处理
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    if (!link.hash) { // 仅处理页面跳转
      document.body.classList.add('page-leave');
      setTimeout(() => {
        window.location = link.href;
      }, 400);
    }
  });
});
