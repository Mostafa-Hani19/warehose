/**
 * وظائف التنقل وإدارة الصفحات
 * يحتوي على جميع الوظائف المتعلقة بالتنقل بين الصفحات وإدارة حالة التطبيق
 */

// ==================== استيراد الوظائف المطلوبة ====================
// سيتم استيراد هذه الوظائف من ملفات أخرى عند تجميع المشروع

// ==================== المتغيرات العامة ====================
let currentPage = 'dashboard';
let isNavigating = false; // لتجنب التنقل المزدوج عند معالجة popstate

// تحميل الصفحة المحفوظة فوراً قبل DOMContentLoaded
(function() {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = savedPage;
        console.log(`⚡ تحميل سريع للصفحة: ${savedPage}`);
    }
})();

// ==================== وظائف التهيئة ====================
/**
 * تهيئة الصفحة الرئيسية
 */
function initializePage() {
    // محاولة استرجاع آخر صفحة مفتوحة من localStorage
    const savedPage = localStorage.getItem('currentPage');
    const pageToShow = savedPage || 'dashboard';
    
    console.log(`📄 استرجاع الصفحة: ${pageToShow}`);
    
    // تهيئة التاريخ - إضافة الحالة الأولى إلى التاريخ
    if (!history.state || !history.state.page) {
        history.replaceState({ page: pageToShow }, '', `#${pageToShow}`);
    }
    
    showPage(pageToShow, false); // false = لا نضيف حالة جديدة للتاريخ
}

// ==================== إعداد مستمعي الأحداث ====================
/**
 * إعداد جميع مستمعي الأحداث في الصفحة
 */
function setupEventListeners() {
    // التنقل في الشريط الجانبي
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page, true); // true = إضافة حالة جديدة للتاريخ
            }
            // إغلاق القائمة المحمولة عند النقر على رابط
            closeMobileMenu();
        });
    });

    // إضافة معالج لحدث popstate (زر الرجوع/التقدم)
    window.addEventListener('popstate', function(e) {
        if (isNavigating) return; // تجنب التنقل المزدوج
        
        isNavigating = true;
        
        // استرجاع الصفحة من حالة التاريخ
        const page = e.state ? e.state.page : (localStorage.getItem('currentPage') || 'dashboard');
        
        console.log(`🔙 الرجوع إلى الصفحة: ${page}`);
        showPage(page, false); // false = لا نضيف حالة جديدة للتاريخ
        
        setTimeout(() => {
            isNavigating = false;
        }, 100);
    });

    // دوال مساعدة للقائمة المحمولة
    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // ملاحظة: التحكم في زر القائمة المحمولة (mobileMenuBtn) يتم في ملف ui-responsive.js
    // لتجنب التعارض، لا نضيف event listener هنا

    // إغلاق القائمة المحمولة عند النقر خارجه (فقط إذا كانت مفتوحة)
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            if (!e.target.closest('#sidebar') && !e.target.closest('#mobileMenuBtn')) {
                closeSidebar();
            }
        }
    });


    // إغلاق عبر زر Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });

    // نموذج إضافة دواء
    const addMedicineForm = document.getElementById('addMedicineForm');
    if (addMedicineForm) {
        addMedicineForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof addMedicine === 'function') {
                addMedicine();
            }
        });
    }

    // نموذج تعديل دواء
    const editMedicineForm = document.getElementById('editMedicineForm');
    if (editMedicineForm) {
        editMedicineForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof updateMedicine === 'function') {
                updateMedicine();
            }
        });
    }


    // نموذج إضافة شركة
    const addCompanyForm = document.getElementById('addCompanyForm');
    if (addCompanyForm) {
        addCompanyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof addCompany === 'function') {
                addCompany();
            }
        });
    }

    // نموذج تعديل شركة
    const editCompanyForm = document.getElementById('editCompanyForm');
    if (editCompanyForm) {
        editCompanyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof updateCompany === 'function') {
                updateCompany();
            }
        });
    }

    // نموذج الدفع
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof recordPayment === 'function') {
                recordPayment();
            }
        });
    }
}

// ==================== وظائف التنقل ====================
/**
 * عرض صفحة محددة وإخفاء الصفحات الأخرى
 * @param {string} pageName - اسم الصفحة المراد عرضها
 * @param {boolean} addToHistory - إضافة إلى التاريخ (true) أو استبدال الحالة الحالية (false)
 */
function showPage(pageName, addToHistory = true) {
    if (!pageName) {
        console.warn('⚠️ اسم الصفحة غير محدد');
        return;
    }

    // إخفاء جميع الصفحات
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });

    // إزالة التفعيل من جميع عناصر التنقل
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active', 'bg-white', 'bg-opacity-20');
    });

    // إظهار الصفحة المحددة
    const pageElement = document.getElementById(pageName + '-page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
    } else {
        console.warn(`⚠️ لم يتم العثور على الصفحة: ${pageName}-page`);
        // الرجوع إلى الصفحة الرئيسية إذا لم يتم العثور على الصفحة
        pageName = 'dashboard';
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage) {
            dashboardPage.classList.remove('hidden');
        }
    }

    // تفعيل عنصر التنقل المحدد
    const activeNavItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active', 'bg-white', 'bg-opacity-20');
    }

    currentPage = pageName;
    
    // حفظ الصفحة الحالية في localStorage
    localStorage.setItem('currentPage', pageName);
    console.log(`💾 تم حفظ الصفحة: ${pageName}`);
    
    // إضافة/تحديث التاريخ
    if (addToHistory) {
        history.pushState({ page: pageName }, '', `#${pageName}`);
    } else {
        history.replaceState({ page: pageName }, '', `#${pageName}`);
    }

    // على الشاشات الصغيرة: إغلاق الشريط الجانبي تلقائياً بعد التنقل
    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
    
    // تحميل الرسائل عند فتح صفحة التواصل
    if (pageName === 'contact' && typeof loadMyMessages === 'function') {
        loadMyMessages();
        console.log('📨 تحميل الرسائل...');
    }
    
    // تحميل الشركات والأدوية عند فتح صفحة الطلبات أو صفحة إنشاء طلب جديد
    if ((pageName === 'orders' || pageName === 'create-order') && typeof loadCompaniesAndMedicines === 'function') {
        loadCompaniesAndMedicines();
        console.log('🏢 تحميل الشركات والأدوية...');
    }
    
    // تحميل الطلبات الواردة عند فتح صفحة الطلبات الواردة
    if (pageName === 'incoming-orders' && typeof loadIncomingOrders === 'function') {
        loadIncomingOrders();
        console.log('📥 تحميل الطلبات الواردة...');
    }
    
    // تحميل المحادثات عند فتح صفحة الشات
    if (pageName === 'chat' && typeof loadConversations === 'function') {
        loadConversations();
        console.log('💬 تحميل المحادثات...');
    }
    
    // تحميل الاسترجاعات عند فتح صفحة الاسترجاعات
    if (pageName === 'returns' && typeof loadReturns === 'function') {
        loadReturns();
        loadCompaniesForReturns();
        console.log('🔄 تحميل طلبات الاسترجاع...');
    }
    
    // تحميل الأدوية وتهيئة الفلاتر عند فتح صفحة الأدوية
    if (pageName === 'medicines') {
        if (typeof loadMedicines === 'function') {
            loadMedicines();
        }
        if (typeof initializeSearchAndFilter === 'function') {
            initializeSearchAndFilter();
        }
        console.log('💊 تحميل الأدوية وتهيئة الفلاتر...');
    }
    
    // تحديث عناصر التنقل عند فتح صفحة تفاصيل الشركة
    if (pageName === 'company-details') {
        // إخفاء عناصر التنقل غير الضرورية
        const companyDetailsNavItem = document.querySelector('[data-page="company-details"]');
        if (companyDetailsNavItem) {
            companyDetailsNavItem.style.display = 'flex';
        }
    } else {
        // إظهار جميع عناصر التنقل
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.style.display = 'flex';
        });
        
        // إخفاء عنصر تفاصيل الشركة
        const companyDetailsNavItem = document.querySelector('[data-page="company-details"]');
        if (companyDetailsNavItem) {
            companyDetailsNavItem.style.display = 'none';
        }
    }
}

/**
 * إغلاق القائمة المحمولة
 */
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        sidebar.classList.remove('open');
    }

    // إعادة تفعيل تمرير الصفحة
    document.body.style.overflow = '';
}

// ==================== تهيئة الصفحة ====================
document.addEventListener('DOMContentLoaded', async function() {
    initializePage();
    setupEventListeners();
    
    // تهيئة الوظائف المتجاوبة
    if (typeof addResponsiveEventListeners === 'function') {
        addResponsiveEventListeners();
    }
    if (typeof optimizeTouchInteractions === 'function') {
        optimizeTouchInteractions();
    }
    if (typeof updateGridLayout === 'function') {
        updateGridLayout();
    }
    if (typeof optimizeTablesForMobile === 'function') {
        optimizeTablesForMobile();
    }
    if (typeof optimizeModalsForMobile === 'function') {
        optimizeModalsForMobile();
    }
    if (typeof optimizePerformanceForMobile === 'function') {
        optimizePerformanceForMobile();
    }
    
    // تحميل البيانات من Supabase
    if (typeof loadMedicines === 'function') {
        await loadMedicines();
    }
    if (typeof loadCompanies === 'function') {
        await loadCompanies();
    }
    if (typeof loadOrders === 'function') {
        await loadOrders();
    }
    if (typeof loadIncomingOrders === 'function') {
        await loadIncomingOrders();
    }
    if (typeof loadAllSystemCompanies === 'function') {
        await loadAllSystemCompanies();
    }
    // تحميل الشركات والأدوية عند تحميل الصفحة لأول مرة (إذا كانت الصفحة الحالية هي orders أو create-order)
    if (typeof loadCompaniesAndMedicines === 'function' && (currentPage === 'orders' || currentPage === 'create-order')) {
        await loadCompaniesAndMedicines();
    }
    
    // تفعيل وظائف البحث بعد تحميل البيانات
    if (typeof initializeSearchAndFilter === 'function') {
        initializeSearchAndFilter();
    }
    
    // التحقق من وجود hash في URL عند التحميل (للتوافق مع الروابط المباشرة)
    if (window.location.hash) {
        const hashPage = window.location.hash.substring(1); // إزالة #
        if (hashPage !== currentPage) {
            showPage(hashPage, false);
        }
    }
});

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePage,
        setupEventListeners,
        showPage,
        closeMobileMenu,
        currentPage
    };
}