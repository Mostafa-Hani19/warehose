/**
 * نظام إدارة المخزن - الصيدلية
 * ملف JavaScript للتحكم في واجهة المستخدم المتجاوبة
 *
 * @version 1.0.0
 * @author Mostafa Hani
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('.main-content');
    const navItems = document.querySelectorAll('.nav-item');

    // دالة لفتح الشريط الجانبي
    const openSidebar = () => {
        if (sidebar) {
            sidebar.classList.add('open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('hidden');
            sidebarOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden'; // منع التمرير
    };

    // دالة لإغلاق الشريط الجانبي
    const closeSidebar = () => {
        if (sidebar) {
            sidebar.classList.remove('open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.classList.add('hidden');
        }
        document.body.style.overflow = ''; // استعادة التمرير
    };

    // فتح الشريط الجانبي عند الضغط على زر القائمة في الجوال
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openSidebar);
    }

    // إغلاق الشريط الجانبي عند الضغط على زر الإغلاق
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }

    // إغلاق الشريط الجانبي عند الضغط على الـ Overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }

    // إغلاق الشريط الجانبي عند الضغط على زر Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // إغلاق الشريط الجانبي عند الضغط على أحد عناصر القائمة (في وضع الجوال)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });

    // زر فتح/إغلاق الشريط الجانبي في الشاشات الكبيرة
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
});