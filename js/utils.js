/**
 * نظام إدارة المخزن - الصيدلية
 * ملف JavaScript للوظائف المساعدة
 * يحتوي على الوظائف المشتركة والمفيدة
 */

// ==================== وظائف مساعدة ====================

/**
 * تنسيق التاريخ للعرض
 * @param {string} dateString - التاريخ بصيغة نصية
 * @returns {string} التاريخ المنسق
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}

/**
 * إظهار إشعار للمستخدم
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الإشعار (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-blue-500'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 
                'fa-info-circle'
            } ml-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * تأكيد من المستخدم قبل تنفيذ عملية حذف
 * @param {string} message - رسالة التأكيد
 * @returns {boolean} true إذا وافق المستخدم
 */
function confirmAction(message = 'هل أنت متأكد من هذا الإجراء؟') {
    return confirm(message);
}

/**
 * تنسيق المبلغ بالجنيه المصري
 * @param {number} amount - المبلغ
 * @returns {string} المبلغ المنسق
 */
function formatCurrency(amount) {
    return `${amount.toFixed(2)} جنيه`;
}

/**
 * تنسيق رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @returns {string} رقم الهاتف المنسق
 */
function formatPhone(phone) {
    // إزالة جميع الأحرف غير الرقمية
    const cleaned = phone.replace(/\D/g, '');
    
    // تنسيق الرقم المصري
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
}

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} true إذا كان البريد صحيح
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف المصري
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} true إذا كان الرقم صحيح
 */
function isValidPhone(phone) {
    const phoneRegex = /^01[0-9]{9}$/;
    const cleaned = phone.replace(/\D/g, '');
    return phoneRegex.test(cleaned);
}

/**
 * إنشاء معرف فريد
 * @returns {string} معرف فريد
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * حفظ البيانات في التخزين المحلي
 * @param {string} key - مفتاح التخزين
 * @param {any} data - البيانات المراد حفظها
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        return false;
    }
}

/**
 * استرجاع البيانات من التخزين المحلي
 * @param {string} key - مفتاح التخزين
 * @param {any} defaultValue - القيمة الافتراضية
 * @returns {any} البيانات المسترجعة
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('خطأ في استرجاع البيانات:', error);
        return defaultValue;
    }
}

/**
 * تصدير البيانات إلى ملف JSON
 * @param {any} data - البيانات المراد تصديرها
 * @param {string} filename - اسم الملف
 */
function exportToJSON(data, filename = 'data.json') {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showNotification('خطأ في تصدير البيانات', 'error');
    }
}

/**
 * استيراد البيانات من ملف JSON
 * @param {File} file - ملف JSON
 * @returns {Promise<any>} البيانات المستوردة
 */
function importFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('ملف JSON غير صحيح'));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('خطأ في قراءة الملف'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * تنظيف النص من الأحرف الخاصة
 * @param {string} text - النص المراد تنظيفه
 * @returns {string} النص المنظف
 */
function sanitizeText(text) {
    return text.replace(/[<>]/g, '').trim();
}

/**
 * تحويل النص إلى عنوان URL صالح
 * @param {string} text - النص المراد تحويله
 * @returns {string} عنوان URL صالح
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * إضافة تأثير تحميل للعنصر
 * @param {HTMLElement} element - العنصر المراد إضافة التأثير له
 * @param {string} text - النص المراد عرضه أثناء التحميل
 */
function showLoading(element, text = 'جاري التحميل...') {
    element.innerHTML = `
        <div class="flex items-center justify-center p-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 ml-2"></div>
            <span>${text}</span>
        </div>
    `;
}

/**
 * إزالة تأثير التحميل من العنصر
 * @param {HTMLElement} element - العنصر المراد إزالة التأثير منه
 * @param {string} content - المحتوى الجديد للعنصر
 */
function hideLoading(element, content = '') {
    element.innerHTML = content;
}

/**
 * نسخ النص إلى الحافظة
 * @param {string} text - النص المراد نسخه
 * @returns {Promise<boolean>} true إذا تم النسخ بنجاح
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('تم نسخ النص إلى الحافظة', 'success');
        return true;
    } catch (error) {
        console.error('خطأ في النسخ:', error);
        showNotification('خطأ في نسخ النص', 'error');
        return false;
    }
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        showNotification,
        confirmAction,
        formatCurrency,
        formatPhone,
        isValidEmail,
        isValidPhone,
        generateId,
        saveToLocalStorage,
        getFromLocalStorage,
        exportToJSON,
        importFromJSON,
        sanitizeText,
        slugify,
        showLoading,
        hideLoading,
        copyToClipboard
    };
}
