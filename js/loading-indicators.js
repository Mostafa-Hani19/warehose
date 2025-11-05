/**
 * نظام مؤشرات التحميل
 * يحتوي على وظائف لإظهار وإخفاء مؤشرات التحميل أثناء العمليات غير المتزامنة
 */

/**
 * إظهار مؤشر التحميل على الزر
 * @param {HTMLElement} button - زر الإرسال
 * @param {string} loadingText - النص المراد عرضه أثناء التحميل
 */
function showButtonLoading(button, loadingText = 'جاري التحميل...') {
    // حفظ النص الأصلي
    button.dataset.originalText = button.innerHTML;
    
    // تعطيل الزر
    button.disabled = true;
    
    // إظهار مؤشر التحميل
    button.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
            <span>${loadingText}</span>
        </div>
    `;
    
    // إضافة كلاس للنمط
    button.classList.add('opacity-90');
}

/**
 * إخفاء مؤشر التحميل على الزر واستعادة حالته الأصلية
 * @param {HTMLElement} button - زر الإرسال
 */
function hideButtonLoading(button) {
    // التأكد من أن الزر كان يحتوي على نص أصلي
    if (button.dataset.originalText) {
        // استعادة النص الأصلي
        button.innerHTML = button.dataset.originalText;
        
        // حذف خاصية النص الأصلي
        delete button.dataset.originalText;
    }
    
    // تفعيل الزر
    button.disabled = false;
    
    // إزالة كلاس النمط
    button.classList.remove('opacity-90');
}

/**
 * إظهار مؤشر التحميل على جدول البيانات
 * @param {string} tableBodyId - معرف عنصر tbody في الجدول
 * @param {string} loadingText - النص المراد عرضه أثناء التحميل
 */
function showTableLoading(tableBodyId, loadingText = 'جاري تحميل البيانات...') {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="100" class="py-8 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <span class="text-gray-600">${loadingText}</span>
                </div>
            </td>
        </tr>
    `;
}

/**
 * إخفاء مؤشر التحميل على جدول البيانات
 */
function hideTableLoading(tableBodyId) {
    // سيتم استبدال المحتوى تلقائياً عند تحميل البيانات
    // هذه الوظيفة موجودة فقط لضمان التوافق مع واجهة البرمجة
}

/**
 * إظهار مؤشر التحميل العام
 * @param {string} containerId - معرف الحاوية
 * @param {string} loadingText - النص المراد عرضه أثناء التحميل
 */
function showGlobalLoading(containerId, loadingText = 'جاري التحميل...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // حفظ المحتوى الأصلي
    container.dataset.originalContent = container.innerHTML;
    
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span class="text-gray-600 text-lg">${loadingText}</span>
        </div>
    `;
}

/**
 * إخفاء مؤشر التحميل العام واستعادة المحتوى الأصلي
 * @param {string} containerId - معرف الحاوية
 */
function hideGlobalLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !container.dataset.originalContent) return;
    
    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showButtonLoading,
        hideButtonLoading,
        showTableLoading,
        hideTableLoading,
        showGlobalLoading,
        hideGlobalLoading
    };
}