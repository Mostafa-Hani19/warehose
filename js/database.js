/**
 * قاعدة بيانات النظام
 * دعم متزامن: Supabase + LocalStorage (للنسخ الاحتياطي)
 */

// ==================== البيانات المحلية للنسخ الاحتياطي ====================
// تم إزالة البيانات المحلية - النظام يستخدم Supabase فقط

// ==================== حفظ البيانات محلياً ====================
function initializeDatabase() {
    // لا توجد بيانات محلية - جميع البيانات من Supabase
    console.log('🔄 تهيئة قاعدة البيانات - استخدام Supabase فقط');
}

// ==================== وظائف قاعدة البيانات ====================

/**
 * تنظيف البيانات المحلية وإعادة تسجيل الدخول
 */
function clearLocalDataAndRelogin() {
    console.log('🔄 تنظيف البيانات المحلية وإعادة تسجيل الدخول...');
    
    // مسح جميع البيانات المحلية
    localStorage.clear();
    sessionStorage.clear();
    
    // إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = 'login.html';
}

/**
 * التحقق من بيانات تسجيل الدخول
 * @param {string} username - اسم المستخدم
 * @param {string} password - كلمة المرور
 * @returns {Object|null} بيانات المستخدم أو null
 */
async function loginUser(username, password) {
    // استخدام Supabase فقط - لا توجد بيانات محلية
    if (typeof loginUserSupabase === 'function') {
        const result = await loginUserSupabase(username, password);
        if (result) {
            console.log('✅ تم تسجيل الدخول من Supabase:', result.username);
            return result;
        } else {
            console.error('❌ فشل تسجيل الدخول من Supabase');
            return null;
        }
    }
    
    console.error('❌ دالة loginUserSupabase غير متاحة');
    return null;
}

/**
 * الحصول على بيانات المستخدم الحالي
 * @returns {Object|null} بيانات المستخدم أو null
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * تسجيل الخروج
 */
function logoutUser() {
    localStorage.removeItem('currentUser');
}

/**
 * التحقق من وجود جلسة نشطة
 * @returns {boolean} true إذا كانت هناك جلسة نشطة
 */
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

/**
 * التحقق من صلاحيات المستخدم
 * @param {string} requiredRole - الصلاحية المطلوبة
 * @returns {boolean} true إذا كان المستخدم لديه الصلاحية
 */
function hasPermission(requiredRole) {
    const user = getCurrentUser();
    if (!user) return false;
    
    if (requiredRole === 'admin') {
        return user.role === 'admin';
    }
    
    return user.role === requiredRole;
}

// تهيئة قاعدة البيانات عند تحميل الملف
initializeDatabase();

