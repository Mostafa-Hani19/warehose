/**
 * وظائف إدارة النماذج (Modals)
 * يحتوي على جميع الوظائف المتعلقة بفتح وإغلاق النماذج المختلفة
 */

// ==================== وظائف النماذج ====================
/**
 * فتح نموذج إضافة دواء جديد
 */
async function openAddMedicineModal() {
    // تحميل قائمة الشركات من Supabase
    let userCompanies = [];
    if (typeof getCompaniesFromSupabase === 'function') {
        userCompanies = await getCompaniesFromSupabase();
    }
    
    // ملء قائمة الشركات في نموذج الإضافة
    const companySelect = document.getElementById('companySelect');
    if (companySelect) {
        // تنظيف الخيارات السابقة
        companySelect.innerHTML = '<option value="">اختر الشركة</option>';
        
        // إضافة الشركات
        if (userCompanies && userCompanies.length > 0) {
            userCompanies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.name;
                option.textContent = company.name;
                companySelect.appendChild(option);
            });
        }
    }
    
    const modal = document.getElementById('addMedicineModal');
    modal.classList.remove('hidden');
    document.getElementById('addMedicineForm').reset();
    
    // إضافة مستمع لإغلاق النموذج عند النقر خارج المحتوى
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddMedicineModal();
        }
    });
}

/**
 * إغلاق نموذج إضافة دواء
 */
function closeAddMedicineModal() {
    document.getElementById('addMedicineModal').classList.add('hidden');
}

/**
 * إغلاق نموذج تعديل دواء
 */
function closeEditMedicineModal() {
    document.getElementById('editMedicineModal').classList.add('hidden');
}

/**
 * فتح نموذج إضافة شركة جديدة
 */
function openAddCompanyModal() {
    const modal = document.getElementById('addCompanyModal');
    modal.classList.remove('hidden');
    document.getElementById('addCompanyForm').reset();
    
    // إضافة مستمع لإغلاق النموذج عند النقر خارج المحتوى
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddCompanyModal();
        }
    });
}

/**
 * إغلاق نموذج إضافة شركة
 */
function closeAddCompanyModal() {
    document.getElementById('addCompanyModal').classList.add('hidden');
}

/**
 * فتح نموذج تسجيل الدفع
 */
function openPaymentModal() {
    // ملء قائمة الطلبات
    const orderSelect = document.querySelector('#paymentForm select[name="orderId"]');
    orderSelect.innerHTML = '<option value="">اختر الطلب</option>';
    
    // الحصول على قائمة الطلبات من data-loader
    if (typeof orders !== 'undefined') {
        orders.forEach(order => {
            const option = document.createElement('option');
            option.value = order.id;
            option.textContent = `${order.orderNumber} - ${order.pharmacy}`;
            orderSelect.appendChild(option);
        });
    }
    
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('hidden');
    document.getElementById('paymentForm').reset();
    
    // إضافة مستمع لإغلاق النموذج عند النقر خارج المحتوى
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePaymentModal();
        }
    });
}

/**
 * إغلاق نموذج تسجيل الدفع
 */
function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

/**
 * ملء قائمة الشركات في النماذج
 */
function populateCompanySelects() {
    // ملء قائمة الشركات في نموذج إضافة الدواء (select)
    const companySelect = document.getElementById('companySelect');
    if (companySelect) {
        try {
            // حفظ القيمة الحالية
            const currentValue = companySelect.value;
            
            // حذف الخيارات القديمة (باستثناء الخيار الأول)
            const optionsArray = Array.from(companySelect.options);
            optionsArray.slice(1).forEach(option => option.remove());
            
            // إضافة الشركات
            if (typeof companies !== 'undefined') {
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.name;
                    option.textContent = company.name;
                    companySelect.appendChild(option);
                });
            }
            
            // استعادة القيمة السابقة
            if (currentValue) {
                companySelect.value = currentValue;
            }
        } catch (error) {
            console.error('خطأ في ملء قائمة الشركات:', error);
        }
    }
    
    // تحديث قائمة اقتراحات الشركات في نموذج تعديل الدواء (input with datalist)
    const editCompanyInput = document.getElementById('editMedicineCompany');
    if (editCompanyInput) {
        try {
            // إنشاء أو تحديث datalist للشركات
            let datalist = document.getElementById('companySuggestions');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'companySuggestions';
                document.body.appendChild(datalist);
            } else {
                // حذف الخيارات القديمة
                datalist.innerHTML = '';
            }
            
            // إضافة الشركات إلى datalist
            if (typeof companies !== 'undefined') {
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.name;
                    datalist.appendChild(option);
                });
            }
            
            // ربط input بـ datalist
            editCompanyInput.setAttribute('list', 'companySuggestions');
        } catch (error) {
            console.error('خطأ في تحديث اقتراحات الشركات:', error);
        }
    }
}

/**
 * إظهار حقل إضافة صنف جديد
 */
function showAddCategoryInput() {
    const categorySelect = document.getElementById('categorySelect');
    const newCategoryInput = document.getElementById('newCategoryInput');
    
    if (categorySelect && newCategoryInput) {
        newCategoryInput.classList.remove('hidden');
        newCategoryInput.focus();
        
        newCategoryInput.addEventListener('blur', function() {
            const newCategory = this.value.trim();
            if (newCategory && !Array.from(categorySelect.options).some(opt => opt.value === newCategory)) {
                const option = document.createElement('option');
                option.value = newCategory;
                option.textContent = newCategory;
                categorySelect.appendChild(option);
                categorySelect.value = newCategory;
            }
            this.value = '';
            this.classList.add('hidden');
        });
    }
}

// تحديث قوائم الشركات عند تحميل الشركات
const originalLoadCompanies = typeof loadCompanies === 'function' ? loadCompanies : null;
if (originalLoadCompanies) {
    loadCompanies = async function() {
        // استدعاء الوظيفة الأصلية
        let result;
        if (typeof originalLoadCompanies === 'function') {
            result = await originalLoadCompanies();
        }
        
        // محاولة ملء قائمة الشركات بعد تحميلها
        try {
            // استخدام setTimeout لضمان اكتمال تحميل DOM
            setTimeout(() => {
                if (typeof populateCompanySelects === 'function') {
                    populateCompanySelects();
                }
            }, 100);
        } catch (error) {
            console.error('خطأ في تحديث قوائم الشركات:', error);
        }
        
        return result;
    };
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openAddMedicineModal,
        closeAddMedicineModal,
        openEditMedicineModal,
        closeEditMedicineModal,
        openAddCompanyModal,
        closeAddCompanyModal,
        openPaymentModal,
        closePaymentModal,
        populateCompanySelects,
        showAddCategoryInput
    };
}