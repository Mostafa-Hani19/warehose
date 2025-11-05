/**
 * نظام التقسيم (Pagination)
 * لتقسيم البيانات إلى صفحات لتحسين الأداء
 */

/**
 * إعدادات Pagination
 */
const PAGINATION_CONFIG = {
    itemsPerPage: 50,
    maxVisiblePages: 5
};

/**
 * إنشاء Pagination Controller
 */
class PaginationController {
    constructor(items, itemsPerPage = PAGINATION_CONFIG.itemsPerPage) {
        this.items = items;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(items.length / itemsPerPage);
    }

    /**
     * الحصول على العناصر للصفحة الحالية
     */
    getCurrentPageItems() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.items.slice(start, end);
    }

    /**
     * الانتقال إلى صفحة معينة
     */
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    /**
     * الانتقال إلى الصفحة التالية
     */
    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }

    /**
     * الانتقال إلى الصفحة السابقة
     */
    previousPage() {
        return this.goToPage(this.currentPage - 1);
    }

    /**
     * الحصول على معلومات Pagination
     */
    getInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.items.length,
            startIndex: (this.currentPage - 1) * this.itemsPerPage + 1,
            endIndex: Math.min(this.currentPage * this.itemsPerPage, this.items.length)
        };
    }

    /**
     * تحديث البيانات
     */
    updateItems(newItems) {
        this.items = newItems;
        this.totalPages = Math.ceil(newItems.length / this.itemsPerPage);
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }
}

/**
 * إنشاء HTML لـ Pagination
 * @param {PaginationController} pagination - Pagination Controller
 * @param {Function} onPageChange - دالة callback عند تغيير الصفحة
 * @returns {string} HTML للـ Pagination
 */
function createPaginationHTML(pagination, onPageChange) {
    const info = pagination.getInfo();
    const pages = [];

    // حساب الصفحات المرئية
    let startPage = Math.max(1, info.currentPage - Math.floor(PAGINATION_CONFIG.maxVisiblePages / 2));
    let endPage = Math.min(info.totalPages, startPage + PAGINATION_CONFIG.maxVisiblePages - 1);

    if (endPage - startPage < PAGINATION_CONFIG.maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - PAGINATION_CONFIG.maxVisiblePages + 1);
    }

    // إضافة زر الصفحة الأولى
    if (startPage > 1) {
        pages.push(`<button onclick="window.paginationHandlers.goToPage(1)" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">1</button>`);
        if (startPage > 2) {
            pages.push(`<span class="px-3 py-2">...</span>`);
        }
    }

    // إضافة الصفحات المرئية
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === info.currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50';
        pages.push(`<button onclick="window.paginationHandlers.goToPage(${i})" class="px-3 py-2 rounded-lg ${activeClass}">${i}</button>`);
    }

    // إضافة زر الصفحة الأخيرة
    if (endPage < info.totalPages) {
        if (endPage < info.totalPages - 1) {
            pages.push(`<span class="px-3 py-2">...</span>`);
        }
        pages.push(`<button onclick="window.paginationHandlers.goToPage(${info.totalPages})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">${info.totalPages}</button>`);
    }

    return `
        <div class="flex items-center justify-between mt-4">
            <div class="text-sm text-gray-600">
                عرض ${info.startIndex} - ${info.endIndex} من ${info.totalItems}
            </div>
            <div class="flex items-center gap-2">
                <button 
                    onclick="window.paginationHandlers.previousPage()" 
                    ${info.currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-chevron-right"></i>
                </button>
                ${pages.join('')}
                <button 
                    onclick="window.paginationHandlers.nextPage()" 
                    ${info.currentPage === info.totalPages ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </div>
        </div>
    `;
}

// تخزين Handlers للـ Pagination
window.paginationHandlers = {};

// تصدير الوظائف
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PaginationController,
        createPaginationHTML,
        PAGINATION_CONFIG
    };
}

// جعل الوظائف متاحة عالمياً
window.PaginationController = PaginationController;
window.createPaginationHTML = createPaginationHTML;

