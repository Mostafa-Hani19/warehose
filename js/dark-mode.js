/**
 * نظام الوضع المظلم (Dark Mode)
 * يدعم التبديل التلقائي واليدوي
 */

/**
 * تهيئة نظام الوضع المظلم
 */
function initDarkMode() {
    // قراءة التفضيل المحفوظ
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // تحديد الوضع الافتراضي
    let isDarkMode = savedMode === 'true' || (savedMode === null && prefersDark);
    
    // تطبيق الوضع
    applyDarkMode(isDarkMode);
    
    // مراقبة تغييرات تفضيلات النظام
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            applyDarkMode(e.matches);
        }
    });
}

/**
 * تطبيق الوضع المظلم
 * @param {boolean} isDark - true للوضع المظلم، false للوضع الفاتح
 */
function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
    }
    
    // تحديث أيقونة التبديل إذا كانت موجودة
    updateDarkModeToggle(isDark);
}

/**
 * تبديل الوضع المظلم
 */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    applyDarkMode(!isDark);
}

/**
 * تحديث أيقونة التبديل
 * @param {boolean} isDark - true للوضع المظلم
 */
function updateDarkModeToggle(isDark) {
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        toggle.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
}

/**
 * الحصول على الوضع الحالي
 * @returns {boolean} true إذا كان الوضع المظلم مفعلاً
 */
function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}

// تهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}

// تصدير الوظائف
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDarkMode,
        applyDarkMode,
        toggleDarkMode,
        isDarkMode
    };
}

// جعل الوظائف متاحة عالمياً
window.darkMode = {
    init: initDarkMode,
    toggle: toggleDarkMode,
    isEnabled: isDarkMode
};

