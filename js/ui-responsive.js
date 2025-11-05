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
    const mainContent = document.querySelector('.main-content');
    const navItems = document.querySelectorAll('.nav-item');

    // التحقق من أن العناصر موجودة (للتصحيح)
    if (!mobileMenuBtn) {
        console.warn('⚠️ زر القائمة المحمولة غير موجود');
    }
    if (!sidebar) {
        console.warn('⚠️ الشريط الجانبي غير موجود');
    }

    // دالة لفتح الشريط الجانبي
    const openSidebar = () => {
        console.log('📱 فتح الشريط الجانبي');
        if (sidebar) {
            sidebar.classList.add('open');
            console.log('✅ تم إضافة class "open" للسيدبار');
        } else {
            console.error('❌ السيدبار غير موجود!');
        }
        document.body.style.overflow = 'hidden'; // منع التمرير
    };

    // دالة لإغلاق الشريط الجانبي
    const closeSidebar = () => {
        console.log('📱 إغلاق الشريط الجانبي');
        if (sidebar) {
            sidebar.classList.remove('open');
            console.log('✅ تم إزالة class "open" من السيدبار');
        }
        document.body.style.overflow = ''; // استعادة التمرير
    };

    // فتح/إغلاق الشريط الجانبي عند الضغط على زر القائمة في الجوال
    if (mobileMenuBtn) {
        console.log('✅ تم العثور على زر القائمة المحمولة');
        mobileMenuBtn.addEventListener('click', (e) => {
            console.log('🖱️ تم الضغط على زر القائمة');
            e.preventDefault();
            e.stopPropagation();
            
            // التأكد من أننا على شاشة صغيرة فقط
            if (window.innerWidth > 1024) {
                console.log('ℹ️ على شاشة كبيرة، لا نفعل شيء');
                return; // لا نفعل شيء على الشاشات الكبيرة
            }
            
            // التحقق من حالة السيدبار الحالية
            if (sidebar && sidebar.classList.contains('open')) {
                console.log('📂 السيدبار مفتوح، سيتم إغلاقه');
                closeSidebar();
            } else {
                console.log('📂 السيدبار مغلق، سيتم فتحه');
                openSidebar();
            }
        }, { passive: false });
        
        // إضافة touch event للدعم على الأجهزة اللوحية
        mobileMenuBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.innerWidth > 1024) {
                return;
            }
            
            if (sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }, { passive: false });
    }

    // إغلاق الشريط الجانبي عند الضغط على زر الإغلاق
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
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