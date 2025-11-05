/**
 * وظائف إدارة النماذج (Modals)
 * يحتوي على جميع الوظائف المتعلقة بإدارة فتح وإغلاق النماذج
 */

// ==================== وظائف نموذج إضافة دواء ====================
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
    
    document.getElementById('addMedicineModal').classList.remove('hidden');
}

function closeAddMedicineModal() {
    document.getElementById('addMedicineModal').classList.add('hidden');
    document.getElementById('addMedicineForm').reset();
}

// ==================== وظائف نموذج تعديل دواء ====================
function openEditMedicineModal(medicine) {
    document.getElementById('editMedicineId').value = medicine.id;
    document.getElementById('editMedicineName').value = medicine.name;
    document.getElementById('editMedicineEnglishName').value = medicine.english_name || '';
    document.getElementById('editMedicineQuantity').value = medicine.quantity;
    document.getElementById('editMedicineStripsCount').value = medicine.strips_count || 0;
    document.getElementById('editMedicinePrice').value = medicine.price;
    document.getElementById('editMedicineDiscountPercentage').value = medicine.discount_percentage || 0.00;
    document.getElementById('editMedicineBarcode').value = medicine.barcode || '';
    document.getElementById('editMedicineExpiryDate').value = medicine.expiry_date;
    document.getElementById('editMedicineCompany').value = medicine.company || '';
    document.getElementById('editMedicineCategory').value = medicine.category || '';
    document.getElementById('editMedicineNotes').value = medicine.notes || '';
    
    document.getElementById('editMedicineModal').classList.remove('hidden');
}

function closeEditMedicineModal() {
    document.getElementById('editMedicineModal').classList.add('hidden');
    document.getElementById('editMedicineForm').reset();
}

// ==================== وظائف نموذج إضافة شركة ====================
function openAddCompanyModal() {
    document.getElementById('addCompanyModal').classList.remove('hidden');
}

function closeAddCompanyModal() {
    document.getElementById('addCompanyModal').classList.add('hidden');
    document.getElementById('addCompanyForm').reset();
}

// ==================== وظائف نموذج تعديل شركة ====================
function openEditCompanyModal(company) {
    document.getElementById('editCompanyId').value = company.id;
    document.getElementById('editCompanyName').value = company.name;
    document.getElementById('editCompanyEmail').value = company.email;
    document.getElementById('editCompanyPhone').value = company.phone;
    document.getElementById('editCompanyAddress').value = company.address;
    
    document.getElementById('editCompanyModal').classList.remove('hidden');
}

function closeEditCompanyModal() {
    document.getElementById('editCompanyModal').classList.add('hidden');
    document.getElementById('editCompanyForm').reset();
}

// ==================== وظائف نموذج تسجيل الدفع ====================
function openPaymentModal() {
    document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    document.getElementById('paymentForm').reset();
}

// ==================== وظائف استيراد البيانات ====================
function importMedicinesData() {
    document.getElementById('importFileInput').click();
}

// تم نقل handleFileImport إلى data-manager.js لتجنب التكرار
// الدالة الموجودة في data-manager.js تدعم CSV

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openAddMedicineModal,
        closeAddMedicineModal,
        openEditMedicineModal,
        closeEditMedicineModal,
        openAddCompanyModal,
        closeAddCompanyModal,
        openEditCompanyModal,
        closeEditCompanyModal,
        openPaymentModal,
        closePaymentModal,
        importMedicinesData,
        recordPayment
    };
}