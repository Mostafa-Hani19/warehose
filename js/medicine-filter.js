/**
 * وظائف تصفية وعرض الأدوية
 * يحتوي على وظائف عرض الأدوية المنتهية والمخزون المنخفض
 */

/**
 * عرض الأدوية المنتهية الصلاحية
 */
function showExpiredMedicines() {
    // الانتقال لصفحة الأدوية
    if (typeof showPage === 'function') {
        showPage('medicines');
    }
    
    // الانتظار قليلاً لضمان تحميل الصفحة
    setTimeout(() => {
        // إعادة تعيين الفلاتر الأخرى
        resetOtherFilters();
        
        // تطبيق فلتر الأدوية المنتهية
        filterExpiredMedicines();
        
        // إضافة زر إعادة التعيين
        addResetFilterButton();
        
        // إظهار إشعار
        if (typeof showNotification === 'function') {
            showNotification('تم عرض الأدوية المنتهية الصلاحية', 'warning');
        }
    }, 300);
}

/**
 * تصفية الأدوية المنتهية الصلاحية
 */
function filterExpiredMedicines() {
    const rows = document.querySelectorAll('#medicinesTableBody tr');
    const now = new Date();
    let expiredCount = 0;
    
    rows.forEach(row => {
        // الحصول على تاريخ الانتهاء من الصف
        const expiryCell = row.querySelector('td:nth-child(5)');
        if (!expiryCell) return;
        
        // استخراج التاريخ من النص
        const expiryText = expiryCell.textContent.trim();
        
        // البحث عن الدواء في القائمة
        const nameCell = row.querySelector('td:nth-child(2) .medicine-name');
        if (!nameCell) return;
        
        const medicineName = nameCell.textContent.trim();
        
        // البحث في قائمة الأدوية
        if (typeof medicines !== 'undefined') {
            const medicine = medicines.find(m => m.name === medicineName);
            if (medicine) {
                const expiryDate = new Date(medicine.expiryDate);
                
                if (expiryDate < now) {
                    // منتهي الصلاحية - إظهار
                    row.style.display = '';
                    row.style.backgroundColor = '#fef3c7'; // تمييز بلون أصفر خفيف
                    expiredCount++;
                } else {
                    // غير منتهي - إخفاء
                    row.style.display = 'none';
                }
            }
        }
    });
    
    // إظهار رسالة إذا لم توجد أدوية منتهية
    if (expiredCount === 0) {
        const tbody = document.getElementById('medicinesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-green-600 font-medium">✅ لا توجد أدوية منتهية الصلاحية</td></tr>';
        }
    }
}

/**
 * عرض الأدوية منخفضة المخزون
 */
function showLowStockMedicines() {
    // الانتقال لصفحة الأدوية
    if (typeof showPage === 'function') {
        showPage('medicines');
    }
    
    // الانتظار قليلاً لضمان تحميل الصفحة
    setTimeout(() => {
        // إعادة تعيين الفلاتر الأخرى
        resetOtherFilters();
        
        // تطبيق فلتر الأدوية منخفضة المخزون
        filterLowStockMedicines();
        
        // إضافة زر إعادة التعيين
        addResetFilterButton();
        
        // إظهار إشعار
        if (typeof showNotification === 'function') {
            showNotification('تم عرض الأدوية منخفضة المخزون', 'warning');
        }
    }, 300);
}

/**
 * تصفية الأدوية منخفضة المخزون
 */
function filterLowStockMedicines() {
    const rows = document.querySelectorAll('#medicinesTableBody tr');
    let lowStockCount = 0;
    
    rows.forEach(row => {
        // الحصول على اسم الدواء
        const nameCell = row.querySelector('td:nth-child(2) .medicine-name');
        if (!nameCell) return;
        
        const medicineName = nameCell.textContent.trim();
        
        // البحث في قائمة الأدوية
        if (typeof medicines !== 'undefined') {
            const medicine = medicines.find(m => m.name === medicineName);
            if (medicine) {
                if (medicine.quantity < 50) {
                    // مخزون منخفض - إظهار
                    row.style.display = '';
                    row.style.backgroundColor = '#fee2e2'; // تمييز بلون أحمر خفيف
                    lowStockCount++;
                } else {
                    // مخزون جيد - إخفاء
                    row.style.display = 'none';
                }
            }
        }
    });
    
    // إظهار رسالة إذا لم توجد أدوية منخفضة المخزون
    if (lowStockCount === 0) {
        const tbody = document.getElementById('medicinesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-green-600 font-medium">✅ جميع الأدوية بمخزون كافٍ</td></tr>';
        }
    }
}

/**
 * إعادة تعيين الفلاتر الأخرى
 */
function resetOtherFilters() {
    // إعادة تعيين البحث
    const searchInput = document.querySelector('#medicines-page .search-input');
    if (searchInput) searchInput.value = '';
    
    // إعادة تعيين فلاتر الشركات والأصناف
    const companyFilter = document.getElementById('companyFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    if (companyFilter) companyFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
}

/**
 * إضافة زر إعادة تعيين التصفية
 */
function addResetFilterButton() {
    // التحقق من وجود الزر
    let resetBtn = document.getElementById('resetFilterBtn');
    
    if (!resetBtn) {
        // إنشاء الزر
        resetBtn = document.createElement('button');
        resetBtn.id = 'resetFilterBtn';
        resetBtn.className = 'px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium';
        resetBtn.innerHTML = '<i class="fas fa-undo ml-2"></i>إظهار الكل';
        resetBtn.onclick = resetMedicineFilter;
        
        // إضافة الزر للصفحة
        const header = document.querySelector('#medicines-page .flex.flex-wrap');
        if (header) {
            header.insertBefore(resetBtn, header.firstChild);
        }
    }
}

/**
 * إعادة تعيين التصفية
 */
function resetMedicineFilter() {
    // إظهار جميع الصفوف
    const rows = document.querySelectorAll('#medicinesTableBody tr');
    rows.forEach(row => {
        row.style.display = '';
        row.style.backgroundColor = '';
    });
    
    // حذف زر إعادة التعيين
    const resetBtn = document.getElementById('resetFilterBtn');
    if (resetBtn) {
        resetBtn.remove();
    }
    
    // إعادة تحميل الأدوية
    if (typeof loadMedicines === 'function') {
        loadMedicines();
    }
    
    // إعادة تعيين الفلاتر الأخرى
    resetOtherFilters();
    
    // إظهار إشعار
    if (typeof showNotification === 'function') {
        showNotification('تم إظهار جميع الأدوية', 'success');
    }
}