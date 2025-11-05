/**
 * نظام إدارة المخزن - الصيدلية
 * ملف JavaScript للبحث والتصفية
 * يحتوي على جميع وظائف البحث والتصفية
 */

// ==================== وظائف البحث ====================

/**
 * البحث في الأدوية
 */
function initializeMedicineSearch() {
    const searchInput = document.querySelector('#medicines-page .search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterMedicines();
        });
    }
}

/**
 * تصفية الأدوية حسب الشركة
 */
function filterMedicinesByCompany() {
    const filterSelect = document.getElementById('companyFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterMedicines();
        });
    }
}

/**
 * تصفية الأدوية حسب الصنف
 */
function filterMedicinesByCategory() {
    const filterSelect = document.getElementById('categoryFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterMedicines();
        });
    }
}

/**
 * إعادة تعيين جميع الفلاتر
 */
function resetAllFilters() {
    const searchInput = document.querySelector('#medicines-page .search-input');
    const companyFilter = document.getElementById('companyFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) searchInput.value = '';
    if (companyFilter) companyFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    
    filterMedicines();
}

/**
 * تطبيق جميع الفلاتر على جدول الأدوية
 */
function filterMedicines() {
    const searchInput = document.querySelector('#medicines-page .search-input');
    const companyFilter = document.getElementById('companyFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const rows = document.querySelectorAll('#medicinesTableBody tr');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const companyFilterValue = companyFilter ? companyFilter.value : 'all';
    const categoryFilterValue = categoryFilter ? categoryFilter.value : 'all';
    
    rows.forEach(row => {
        // الحصول على النص من كل الخلايا
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return; // تجاهل الصفوف الفارغة
        
        const barcode = cells[0]?.textContent.toLowerCase() || '';
        const medicineName = cells[1]?.querySelector('.medicine-name')?.textContent.toLowerCase() || '';
        const englishName = cells[1]?.querySelector('.medicine-english-name')?.textContent.toLowerCase() || '';
        const company = cells[5]?.textContent.toLowerCase() || '';
        const category = cells[6]?.textContent.toLowerCase() || '';
        
        // التحقق من مطابقة البحث
        const matchesSearch = searchTerm === '' || 
                             medicineName.includes(searchTerm) || 
                             englishName.includes(searchTerm) || 
                             barcode.includes(searchTerm) ||
                             company.includes(searchTerm) || 
                             category.includes(searchTerm);
        
        // التحقق من مطابقة الشركة
        const matchesCompany = companyFilterValue === 'all' || company.includes(companyFilterValue);
        
        // التحقق من مطابقة الصنف
        const matchesCategory = categoryFilterValue === 'all' || category.includes(categoryFilterValue);
        
        if (matchesSearch && matchesCompany && matchesCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * البحث في الطلبات
 */
function initializeOrderSearch() {
    const searchInput = document.querySelector('input[placeholder="البحث في الطلبات..."]');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#ordersTableBody tr');
            
            rows.forEach(row => {
                const orderNumber = row.querySelector('td:first-child').textContent.toLowerCase();
                const pharmacy = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const status = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
                
                if (orderNumber.includes(searchTerm) || pharmacy.includes(searchTerm) || status.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}


/**
 * البحث في شركات الأدوية
 */
function initializeCompanySearch() {
    const searchInput = document.querySelector('input[placeholder="البحث في الشركات..."]');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#companiesTableBody tr');
            
            rows.forEach(row => {
                const companyName = row.querySelector('td:first-child').textContent.toLowerCase();
                const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const phone = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                
                if (companyName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// ==================== وظائف التصفية ====================


/**
 * تصفية الطلبات حسب الحالة
 */
function filterOrdersByStatus() {
    const filterSelect = document.getElementById('statusFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            const rows = document.querySelectorAll('#ordersTableBody tr');
            
            rows.forEach(row => {
                if (filterValue === 'all') {
                    row.style.display = '';
                } else {
                    const statusCell = row.querySelector('td:nth-child(6)');
                    const statusText = statusCell.textContent.trim();
                    
                    if (statusText === filterValue) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }
}

// ==================== وظائف الترتيب ====================

/**
 * ترتيب الجدول حسب العمود
 * @param {string} tableId - معرف الجدول
 * @param {number} columnIndex - فهرس العمود
 * @param {string} dataType - نوع البيانات (text, number, date)
 */
function sortTable(tableId, columnIndex, dataType = 'text') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // تحديد اتجاه الترتيب
    const isAscending = !table.dataset.sortDirection || table.dataset.sortDirection === 'desc';
    table.dataset.sortDirection = isAscending ? 'asc' : 'desc';
    
    // ترتيب الصفوف
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        let comparison = 0;
        
        switch (dataType) {
            case 'number':
                comparison = parseFloat(aValue) - parseFloat(bValue);
                break;
            case 'date':
                comparison = new Date(aValue) - new Date(bValue);
                break;
            default:
                comparison = aValue.localeCompare(bValue, 'ar');
        }
        
        return isAscending ? comparison : -comparison;
    });
    
    // إعادة ترتيب الصفوف في الجدول
    rows.forEach(row => tbody.appendChild(row));
    
    // إضافة مؤشر الترتيب
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        // إزالة المؤشرات السابقة
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.remove();
        }
    });
    
    // إضافة المؤشر الجديد
    const currentHeader = table.querySelector(`th:nth-child(${columnIndex + 1})`);
    if (currentHeader) {
        const indicator = document.createElement('i');
        indicator.className = `fas fa-sort-${isAscending ? 'up' : 'down'} sort-indicator ml-1 text-blue-500`;
        currentHeader.appendChild(indicator);
    }
}

/**
 * إضافة وظائف الترتيب لجميع الجداول
 */
function initializeTableSorting() {
    // ترتيب جدول الأدوية
    const medicinesTable = document.getElementById('medicinesTableBody');
    if (medicinesTable) {
        const headers = medicinesTable.closest('table').querySelectorAll('th[data-sort]');
        headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                let dataType = 'text';
                if (header.dataset.sort === 'quantity' || header.dataset.sort === 'price') {
                    dataType = 'number';
                } else if (header.dataset.sort === 'expiryDate') {
                    dataType = 'date';
                } else if (header.dataset.sort === 'barcode') {
                    dataType = 'text';
                }
                
                sortTable('medicinesTableBody', index, dataType);
            });
        });
    }
    
    // ترتيب جدول الطلبات
    const ordersTable = document.getElementById('ordersTableBody');
    if (ordersTable) {
        const headers = ordersTable.closest('table').querySelectorAll('th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                let dataType = 'text';
                if (index === 3) dataType = 'number'; // المبلغ
                if (index === 2) dataType = 'date'; // التاريخ
                
                sortTable('ordersTableBody', index, dataType);
            });
        });
    }
    
}

// ==================== تهيئة وظائف البحث والتصفية ====================

/**
 * تهيئة جميع وظائف البحث والتصفية
 */
function initializeSearchAndFilter() {
    initializeMedicineSearch();
    initializeOrderSearch();
    initializeCompanySearch();
    filterMedicinesByCompany();
    filterMedicinesByCategory();
    filterOrdersByStatus();
    initializeTableSorting();
    
    // إضافة مستمع لزر إعادة تعيين الفلاتر
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
    }
}

// تهيئة الوظائف عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeSearchAndFilter();
});