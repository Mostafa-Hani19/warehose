/**
 * وظائف إدارة البيانات
 * يحتوي على جميع الوظائف المتعلقة بإدارة البيانات (إضافة، تحديث، حذف)
 */

/**
 * إضافة دواء جديد إلى القائمة
 */
async function addMedicine() {
    const form = document.getElementById('addMedicineForm');
    const formData = new FormData(form);
    
    // إظهار مؤشر التحميل على زر الإرسال
    const submitButton = form.querySelector('button[type="submit"]');
    if (typeof showButtonLoading === 'function' && submitButton) {
        showButtonLoading(submitButton, 'جاري الإضافة...');
    }
    
    const newMedicine = {
        name: formData.get('name'),
        englishName: formData.get('englishName'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        expiryDate: formData.get('expiryDate'),
        company: formData.get('company'),
        category: formData.get('category') || 'غير مصنف',
        notes: formData.get('notes'),
        barcode: formData.get('barcode'),
        stripQuantity: parseInt(formData.get('stripQuantity')) || 0,
        discountPercentage: parseFloat(formData.get('discountPercentage')) || 0
    };
    
    // محاولة الحفظ في Supabase
    if (typeof addMedicineToSupabase === 'function') {
        try {
            const result = await addMedicineToSupabase(newMedicine);
            if (result) {
                if (typeof showNotification === 'function') {
                    showNotification('تم إضافة الدواء بنجاح', 'success');
                }
                if (typeof loadMedicines === 'function') {
                    loadMedicines();
                }
                if (typeof closeAddMedicineModal === 'function') {
                    closeAddMedicineModal();
                }
                // إخفاء مؤشر التحميل
                if (typeof hideButtonLoading === 'function' && submitButton) {
                    hideButtonLoading(submitButton);
                }
                return;
            }
        } catch (error) {
            console.error('❌ خطأ في إضافة الدواء:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'حدث خطأ أثناء إضافة الدواء', 'error');
            }
            if (typeof hideButtonLoading === 'function' && submitButton) {
                hideButtonLoading(submitButton);
            }
            return;
        }
    }
    
    // Fallback للبيانات المحلية
    if (typeof medicines !== 'undefined') {
        newMedicine.id = medicines.length + 1;
        medicines.push(newMedicine);
        localStorage.setItem('medicines', JSON.stringify(medicines));
        if (typeof loadMedicines === 'function') {
            loadMedicines();
        }
        if (typeof closeAddMedicineModal === 'function') {
            closeAddMedicineModal();
        }
        if (typeof showNotification === 'function') {
            showNotification('تم إضافة الدواء بنجاح', 'success');
        }
    }
    
    // إخفاء مؤشر التحميل
    if (typeof hideButtonLoading === 'function' && submitButton) {
        hideButtonLoading(submitButton);
    }
}

/**
 * تحديث دواء موجود
 */
async function updateMedicine() {
    const form = document.getElementById('editMedicineForm');
    const formData = new FormData(form);
    
    // إظهار مؤشر التحميل على زر الإرسال
    const submitButton = form.querySelector('button[type="submit"]');
    if (typeof showButtonLoading === 'function' && submitButton) {
        showButtonLoading(submitButton, 'جاري التحديث...');
    }
    
    const medicineId = formData.get('id'); // لا تقم بتحويل الـ UUID إلى رقم
    const updatedMedicine = {
        name: formData.get('name'),
        englishName: formData.get('englishName'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        expiryDate: formData.get('expiryDate'),
        company: formData.get('company'),
        category: formData.get('category') || 'غير مصنف',
        notes: formData.get('notes'),
        barcode: formData.get('barcode'),
        stripQuantity: parseInt(formData.get('stripQuantity')) || 0,
        discountPercentage: parseFloat(formData.get('discountPercentage')) || 0
    };
    
    // محاولة التحديث في Supabase
    if (typeof updateMedicineInSupabase === 'function') {
        const result = await updateMedicineInSupabase(medicineId, updatedMedicine);
        if (result) {
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث الدواء بنجاح', 'success');
            }
            if (typeof loadMedicines === 'function') {
                loadMedicines();
            }
            if (typeof closeEditMedicineModal === 'function') {
                closeEditMedicineModal();
            }
            // إخفاء مؤشر التحميل
            if (typeof hideButtonLoading === 'function' && submitButton) {
                hideButtonLoading(submitButton);
            }
            return;
        }
    }
    
    // Fallback للبيانات المحلية
    if (typeof medicines !== 'undefined') {
        const medicineIndex = medicines.findIndex(m => m.id === medicineId);
        if (medicineIndex !== -1) {
            medicines[medicineIndex] = { ...medicines[medicineIndex], ...updatedMedicine };
            localStorage.setItem('medicines', JSON.stringify(medicines));
            if (typeof loadMedicines === 'function') {
                loadMedicines();
            }
            if (typeof closeEditMedicineModal === 'function') {
                closeEditMedicineModal();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث الدواء بنجاح', 'success');
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification('لم يتم العثور على الدواء', 'error');
            }
        }
    }
    
    // إخفاء مؤشر التحميل
    if (typeof hideButtonLoading === 'function' && submitButton) {
        hideButtonLoading(submitButton);
    }
}

/**
 * إضافة شركة جديدة
 */
async function addCompany() {
    console.log('🔄 جاري إضافة شركة جديدة...');
    
    const form = document.getElementById('addCompanyForm');
    const formData = new FormData(form);
    
    // إظهار مؤشر التحميل على زر الإرسال
    const submitButton = form.querySelector('button[type="submit"]');
    if (typeof showButtonLoading === 'function' && submitButton) {
        showButtonLoading(submitButton, 'جاري الإضافة...');
    }
    
    const companyData = {
        name: formData.get('name'),
        email: formData.get('email') || null,
        phone: formData.get('phone') || null,
        address: formData.get('address') || null
    };
    
    console.log('📱 بيانات الشركة المرسلة:', companyData);
    
    // التحقق من أن اسم الشركة غير فارغ
    if (!companyData.name) {
        console.log('❌ اسم الشركة مطلوب');
        if (typeof showNotification === 'function') {
            showNotification('اسم الشركة مطلوب', 'error');
        }
        if (typeof hideButtonLoading === 'function' && submitButton) {
            hideButtonLoading(submitButton);
        }
        return;
    }
    
    // محاولة الحفظ في Supabase
    if (typeof addCompanyToSupabase === 'function') {
        try {
            console.log('💾 جاري حفظ الشركة في Supabase...');
            const result = await addCompanyToSupabase(companyData);
            console.log('📱 نتيجة حفظ الشركة:', result);
            if (result) {
                console.log('✅ تم إضافة الشركة بنجاح');
                if (typeof showNotification === 'function') {
                    showNotification('تم إضافة الشركة بنجاح', 'success');
                }
                if (typeof loadCompanies === 'function') {
                    console.log('🔄 جاري إعادة تحميل الشركات...');
                    loadCompanies();
                }
                if (typeof closeAddCompanyModal === 'function') {
                    closeAddCompanyModal();
                }
                // إخفاء مؤشر التحميل
                if (typeof hideButtonLoading === 'function' && submitButton) {
                    hideButtonLoading(submitButton);
                }
                return;
            }
        } catch (error) {
            console.error('❌ خطأ في إضافة الشركة:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'فشل في إضافة الشركة. يرجى المحاولة مرة أخرى', 'error');
            }
            if (typeof hideButtonLoading === 'function' && submitButton) {
                hideButtonLoading(submitButton);
            }
            return;
        }
    }
    
    // Fallback للبيانات المحلية
    console.log('💾 استخدام التخزين المحلي كاحتياطي...');
    const newCompany = {
        id: typeof companies !== 'undefined' ? companies.length + 1 : 1,
        ...companyData,
        medicinesCount: 0
    };
    
    if (typeof companies !== 'undefined') {
        companies.push(newCompany);
        localStorage.setItem('companies', JSON.stringify(companies));
        if (typeof loadCompanies === 'function') {
            loadCompanies();
        }
        if (typeof closeAddCompanyModal === 'function') {
            closeAddCompanyModal();
        }
        if (typeof showNotification === 'function') {
            showNotification('تم إضافة الشركة بنجاح', 'success');
        }
    }
    
    // إخفاء مؤشر التحميل
    if (typeof hideButtonLoading === 'function' && submitButton) {
        hideButtonLoading(submitButton);
    }
}

/**
 * تعديل شركة (قيد التطوير)
 * @param {number} companyId - معرف الشركة
 */
function editCompany(companyId) {
    console.log('🔄 جاري تحرير الشركة:', companyId);
    
    if (typeof companies === 'undefined') {
        console.log('❌ companies array غير معرف');
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    
    if (company) {
        console.log('📱 بيانات الشركة للتحرير:', company);
        // ملء نموذج التعديل بالبيانات الحالية
        document.getElementById('editCompanyId').value = company.id;
        document.getElementById('editCompanyName').value = company.name;
        document.getElementById('editCompanyEmail').value = company.email;
        document.getElementById('editCompanyPhone').value = company.phone;
        document.getElementById('editCompanyAddress').value = company.address;
        
        // إظهار نموذج التعديل
        document.getElementById('editCompanyModal').classList.remove('hidden');
    } else {
        console.log('❌ لم يتم العثور على الشركة:', companyId);
    }
}

/**
 * إغلاق نموذج تعديل شركة
 */
function closeEditCompanyModal() {
    document.getElementById('editCompanyModal').classList.add('hidden');
    document.getElementById('editCompanyForm').reset();
}

/**
 * تحديث شركة موجودة
 */
async function updateCompany() {
    console.log('🔄 جاري تحديث الشركة...');
    
    const form = document.getElementById('editCompanyForm');
    const formData = new FormData(form);
    
    // إظهار مؤشر التحميل على زر الإرسال
    const submitButton = form.querySelector('button[type="submit"]');
    if (typeof showButtonLoading === 'function' && submitButton) {
        showButtonLoading(submitButton, 'جاري التحديث...');
    }
    
    const companyId = formData.get('id');
    const updatedCompany = {
        name: formData.get('name'),
        email: formData.get('email') || null,
        phone: formData.get('phone') || null,
        address: formData.get('address') || null
    };
    
    console.log('📱 بيانات الشركة المحدثة:', companyId, updatedCompany);
    
    // التحقق من أن اسم الشركة غير فارغ
    if (!updatedCompany.name) {
        console.log('❌ اسم الشركة مطلوب');
        if (typeof showNotification === 'function') {
            showNotification('اسم الشركة مطلوب', 'error');
        }
        if (typeof hideButtonLoading === 'function' && submitButton) {
            hideButtonLoading(submitButton);
        }
        return;
    }
    
    // محاولة التحديث في Supabase
    if (typeof updateCompanyInSupabase === 'function') {
        console.log('💾 جاري تحديث الشركة في Supabase...');
        const result = await updateCompanyInSupabase(companyId, updatedCompany);
        console.log('📱 نتيجة تحديث الشركة:', result);
        if (result) {
            console.log('✅ تم تحديث الشركة بنجاح');
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث الشركة بنجاح', 'success');
            }
            if (typeof loadCompanies === 'function') {
                console.log('🔄 جاري إعادة تحميل الشركات...');
                loadCompanies();
            }
            if (typeof closeEditCompanyModal === 'function') {
                closeEditCompanyModal();
            }
            // إخفاء مؤشر التحميل
            if (typeof hideButtonLoading === 'function' && submitButton) {
                hideButtonLoading(submitButton);
            }
            return;
        } else {
            // في حالة فشل التحديث
            console.log('❌ فشل في تحديث الشركة');
            if (typeof showNotification === 'function') {
                showNotification('فشل في تحديث الشركة. يرجى المحاولة مرة أخرى', 'error');
            }
            if (typeof hideButtonLoading === 'function' && submitButton) {
                hideButtonLoading(submitButton);
            }
            return;
        }
    }
    
    // Fallback للبيانات المحلية
    if (typeof companies !== 'undefined') {
        const companyIndex = companies.findIndex(c => c.id === companyId);
        if (companyIndex !== -1) {
            companies[companyIndex] = { ...companies[companyIndex], ...updatedCompany };
            localStorage.setItem('companies', JSON.stringify(companies));
            if (typeof loadCompanies === 'function') {
                loadCompanies();
            }
            if (typeof closeEditCompanyModal === 'function') {
                closeEditCompanyModal();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث الشركة بنجاح', 'success');
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification('لم يتم العثور على الشركة', 'error');
            }
        }
    }
    
    // إخفاء مؤشر التحميل
    if (typeof hideButtonLoading === 'function' && submitButton) {
        hideButtonLoading(submitButton);
    }
}

/**
 * حذف شركة
 * @param {number} companyId - معرف الشركة
 */
async function deleteCompany(companyId) {
    console.log('🔄 جاري حذف الشركة:', companyId);
    
    if (confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
        // البحث عن زر الحذف إذا كان موجوداً
        const deleteButton = document.querySelector(`button[onclick="deleteCompany('${companyId}')"]`);
        
        // إظهار مؤشر التحميل على زر الحذف
        if (typeof showButtonLoading === 'function' && deleteButton) {
            showButtonLoading(deleteButton, 'جاري الحذف...');
        }
        
        // محاولة الحذف من Supabase
        if (typeof deleteCompanyFromSupabase === 'function') {
            console.log('💾 جاري حذف الشركة من Supabase...');
            const result = await deleteCompanyFromSupabase(companyId);
            console.log('📱 نتيجة حذف الشركة:', result);
            if (result) {
                console.log('✅ تم حذف الشركة');
                if (typeof showNotification === 'function') {
                    showNotification('تم حذف الشركة', 'success');
                }
                if (typeof loadCompanies === 'function') {
                    console.log('🔄 جاري إعادة تحميل الشركات...');
                    loadCompanies();
                }
                // إخفاء مؤشر التحميل
                if (typeof hideButtonLoading === 'function' && deleteButton) {
                    hideButtonLoading(deleteButton);
                }
                return;
            }
        }
        
        // Fallback للبيانات المحلية
        if (typeof companies !== 'undefined') {
            companies = companies.filter(c => c.id !== companyId);
            localStorage.setItem('companies', JSON.stringify(companies));
            if (typeof loadCompanies === 'function') {
                loadCompanies();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم حذف الشركة', 'success');
            }
        }
        
        // إخفاء مؤشر التحميل
        if (typeof hideButtonLoading === 'function' && deleteButton) {
            hideButtonLoading(deleteButton);
        }
    }
}

/**
 * تحديث حالة الطلب
 * @param {number} orderId - معرف الطلب
 * @param {string} newStatus - الحالة الجديدة
 */
function updateOrderStatus(orderId, newStatus) {
    // البحث في الطلبات الصادرة أولاً
    if (typeof orders !== 'undefined') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            if (typeof loadOrders === 'function') {
                loadOrders();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث حالة الطلب', 'success');
            }
            return;
        }
    }
    
    // البحث في الطلبات الواردة إذا لم يُعثر على الطلب في الصادرة
    if (typeof incomingOrders !== 'undefined') {
        const order = incomingOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            if (typeof loadIncomingOrders === 'function') {
                loadIncomingOrders();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تحديث حالة الطلب', 'success');
            }
            return;
        }
    }
    
    // إذا لم يُعثر على الطلب في أي من القوائم
    if (typeof showNotification === 'function') {
        showNotification('لم يتم العثور على الطلب', 'error');
    }
}

/**
 * تسجيل الدفع للطلب
 */
function recordPayment() {
    const form = document.getElementById('paymentForm');
    const formData = new FormData(form);
    
    const orderId = formData.get('orderId');
    
    // البحث في الطلبات الصادرة أولاً
    if (typeof orders !== 'undefined') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.paymentMethod = formData.get('paymentMethod');
            order.paidAmount = parseFloat(formData.get('amount'));
            order.paymentNotes = formData.get('notes');
            
            if (typeof loadOrders === 'function') {
                loadOrders();
            }
            if (typeof closePaymentModal === 'function') {
                closePaymentModal();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تسجيل الدفع بنجاح', 'success');
            }
            return;
        }
    }
    
    // البحث في الطلبات الواردة إذا لم يُعثر على الطلب في الصادرة
    if (typeof incomingOrders !== 'undefined') {
        const order = incomingOrders.find(o => o.id === orderId);
        if (order) {
            order.paymentMethod = formData.get('paymentMethod');
            order.paidAmount = parseFloat(formData.get('amount'));
            order.paymentNotes = formData.get('notes');
            
            if (typeof loadIncomingOrders === 'function') {
                loadIncomingOrders();
            }
            if (typeof closePaymentModal === 'function') {
                closePaymentModal();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم تسجيل الدفع بنجاح', 'success');
            }
            return;
        }
    }
    
    // إذا لم يُعثر على الطلب في أي من القوائم
    if (typeof showNotification === 'function') {
        showNotification('لم يتم العثور على الطلب', 'error');
    }
    if (typeof closePaymentModal === 'function') {
        closePaymentModal();
    }
}

/**
 * تسجيل الدفع (الطريقة القديمة - للتوافق)
 * @param {number} orderId - معرف الطلب
 */
function recordPaymentOld(orderId) {
    // البحث في الطلبات الصادرة أولاً
    if (typeof orders !== 'undefined') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const paymentMethod = prompt('طريقة الدفع:', order.paymentMethod);
            if (paymentMethod) {
                order.paymentMethod = paymentMethod;
                if (typeof loadOrders === 'function') {
                    loadOrders();
                }
                if (typeof showNotification === 'function') {
                    showNotification('تم تسجيل طريقة الدفع', 'success');
                }
            }
            return;
        }
    }
    
    // البحث في الطلبات الواردة إذا لم يُعثر على الطلب في الصادرة
    if (typeof incomingOrders !== 'undefined') {
        const order = incomingOrders.find(o => o.id === orderId);
        if (order) {
            const paymentMethod = prompt('طريقة الدفع:', order.paymentMethod);
            if (paymentMethod) {
                order.paymentMethod = paymentMethod;
                if (typeof loadIncomingOrders === 'function') {
                    loadIncomingOrders();
                }
                if (typeof showNotification === 'function') {
                    showNotification('تم تسجيل طريقة الدفع', 'success');
                }
            }
            return;
        }
    }
    
    // إذا لم يُعثر على الطلب في أي من القوائم
    if (typeof showNotification === 'function') {
        showNotification('لم يتم العثور على الطلب', 'error');
    }
}

/**
 * تعديل دواء
 * @param {number} medicineId - معرف الدواء
 */
async function editMedicine(medicineId) {
    if (typeof medicines === 'undefined') return;
    
    const medicine = medicines.find(m => m.id.toString() === medicineId.toString());
    
    if (medicine) {
        // تحميل قائمة الشركات من Supabase
        let userCompanies = [];
        if (typeof getCompaniesFromSupabase === 'function') {
            userCompanies = await getCompaniesFromSupabase();
        }
        
        // ملء قائمة الشركات في نموذج التعديل
        const companySelect = document.getElementById('editMedicineCompany');
        if (companySelect) {
            // تنظيف الخيارات السابقة
            companySelect.innerHTML = '<option value="">اختر الشركة</option>';
            
            // إضافة الشركات
            if (userCompanies && userCompanies.length > 0) {
                userCompanies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.name;
                    option.textContent = company.name;
                    // تحديد الشركة الحالية للدواء
                    if (medicine.company === company.name) {
                        option.selected = true;
                    }
                    companySelect.appendChild(option);
                });
            }
        }
        
        // ملء نموذج التعديل بالبيانات الحالية
        document.getElementById('editMedicineId').value = medicine.id;
        document.getElementById('editMedicineName').value = medicine.name;
        document.getElementById('editMedicineEnglishName').value = medicine.englishName || '';
        document.getElementById('editMedicineQuantity').value = medicine.quantity;
        document.getElementById('editMedicinePrice').value = medicine.price;
        document.getElementById('editMedicineExpiryDate').value = medicine.expiryDate;
        document.getElementById('editMedicineCategory').value = medicine.category || 'غير مصنف';
        document.getElementById('editMedicineNotes').value = medicine.notes || '';
        document.getElementById('editMedicineBarcode').value = medicine.barcode || '';
        document.getElementById('editMedicineStripQuantity').value = medicine.stripQuantity || 0;
        document.getElementById('editMedicineDiscountPercentage').value = medicine.discountPercentage || 0;

        
        // إظهار نموذج التعديل
        document.getElementById('editMedicineModal').classList.remove('hidden');
    } else {
        if (typeof showNotification === 'function') {
            showNotification('لم يتم العثور على الدواء', 'error');
        }
    }
}

/**
 * إغلاق نموذج تعديل دواء
 */
function closeEditMedicineModal() {
    document.getElementById('editMedicineModal').classList.add('hidden');
    document.getElementById('editMedicineForm').reset();
}

/**
 * حذف دواء
 * @param {number} medicineId - معرف الدواء
 */
async function deleteMedicine(medicineId) {
    if (confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
        // البحث عن زر الحذف إذا كان موجوداً
        const deleteButton = document.querySelector(`button[onclick="deleteMedicine('${medicineId}')"]`) || 
                            document.querySelector(`button[onclick="deleteMedicine(${medicineId})"]`);
        
        // إظهار مؤشر التحميل على زر الحذف
        if (typeof showButtonLoading === 'function' && deleteButton) {
            showButtonLoading(deleteButton, 'جاري الحذف...');
        }
        
        // محاولة الحذف من Supabase
        if (typeof deleteMedicineFromSupabase === 'function') { // medicineId is likely a string from the onclick attribute
            const result = await deleteMedicineFromSupabase(medicineId);
            if (result) {
                if (typeof showNotification === 'function') {
                    showNotification('تم حذف الدواء', 'success');
                }
                if (typeof loadMedicines === 'function') {
                    loadMedicines();
                }
                // إخفاء مؤشر التحميل
                if (typeof hideButtonLoading === 'function' && deleteButton) {
                    hideButtonLoading(deleteButton);
                }
                return;
            }
        }
        
        // Fallback للبيانات المحلية
        if (typeof medicines !== 'undefined') {
            medicines = medicines.filter(m => m.id.toString() !== medicineId.toString());
            localStorage.setItem('medicines', JSON.stringify(medicines));
            if (typeof loadMedicines === 'function') {
                loadMedicines();
            }
            if (typeof showNotification === 'function') {
                showNotification('تم حذف الدواء', 'success');
            }
        }
        
        // إخفاء مؤشر التحميل
        if (typeof hideButtonLoading === 'function' && deleteButton) {
            hideButtonLoading(deleteButton);
        }
    }
}

/**
 * تصدير بيانات الأدوية
 */
function exportMedicinesData() {
    if (typeof medicines === 'undefined') return;
    
    try {
        // تحضير البيانات للتصدير
        const exportData = medicines.map(medicine => ({
            'اسم الدواء': medicine.name,
            'الكمية': medicine.quantity,
            'السعر': medicine.price,
            'تاريخ الانتهاء': typeof formatDate === 'function' ? formatDate(medicine.expiryDate) : medicine.expiryDate,
            'الشركة': medicine.company,
            'الصنف': medicine.category || 'غير مصنف',
            'ملاحظات': medicine.notes || ''
        }));

        // تحويل إلى CSV
        let csvContent = '\ufeff'; // BOM for UTF-8
        const headers = Object.keys(exportData[0]);
        csvContent += headers.join(',') + '\r\n';
        
        exportData.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // إضافة علامات اقتباس إذا احتوى النص على فاصلة أو علامة اقتباس أو أحرف خاصة
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += values.join(',') + '\r\n';
        });
        
        // إنشاء ملف وتنزيله
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `medicines_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showNotification === 'function') {
            showNotification('تم تصدير البيانات بنجاح', 'success');
        }
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        if (typeof showNotification === 'function') {
            showNotification('حدث خطأ في تصدير البيانات', 'error');
        }
    }
}

/**
 * استيراد بيانات الأدوية
 */
function importMedicinesData() {
    document.getElementById('importFileInput').click();
}

/**
 * معالجة ملف الاستيراد
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            let importedData = [];

            if (file.name.endsWith('.csv')) {
                // تحليل CSV
                const lines = content.split(/\r?\n/);
                if (lines.length < 2) return;
                
                // تحليل العناوين
                const headers = parseCSVLine(lines[0]);
                
                // تحليل البيانات
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const values = parseCSVLine(line);
                    const row = {};
                    
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    
                    importedData.push(row);
                }
            } else if (file.name.endsWith('.json')) {
                importedData = JSON.parse(content);
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('نوع الملف غير مدعوم. يرجى استخدام ملف CSV أو JSON', 'error');
                }
                return;
            }

            // تحويل البيانات إلى تنسيق الأدوية
            const medicinesData = importedData.map(item => {
                // معالجة تاريخ الانتهاء - قد يكون بصيغة MM/DD/YYYY (أمريكية) أو DD/MM/YYYY أو ISO
                let expiryDate = item['تاريخ الانتهاء'] || item.expiryDate || '';
                const originalDate = expiryDate; // للتسجيل
                
                // إذا كان التاريخ بصيغة MM/DD/YYYY أو DD/MM/YYYY، نحوله إلى YYYY-MM-DD
                if (expiryDate && expiryDate.includes('/')) {
                    const parts = expiryDate.split('/');
                    if (parts.length === 3) {
                        const part1 = parseInt(parts[0].trim());
                        const part2 = parseInt(parts[1].trim());
                        const part3 = parts[2].trim();
                        
                        let day, month, year;
                        
                        // تحديد الصيغة بناءً على القيم
                        if (part3.length === 4) {
                            year = part3;
                            
                            // إذا part1 > 12، يبقى DD/MM/YYYY
                            // إذا part2 > 12، يبقى MM/DD/YYYY
                            // إذا كلاهما <= 12، نفترض MM/DD/YYYY (الصيغة الأمريكية الأكثر شيوعاً في Excel)
                            if (part1 > 12) {
                                // DD/MM/YYYY
                                day = part1;
                                month = part2;
                            } else if (part2 > 12) {
                                // MM/DD/YYYY
                                month = part1;
                                day = part2;
                            } else {
                                // كلاهما <= 12، نفترض MM/DD/YYYY (الصيغة الأمريكية)
                                month = part1;
                                day = part2;
                            }
                            
                            expiryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        } else if (parts[0].trim().length === 4) {
                            // YYYY/MM/DD (already correct order)
                            year = parts[0].trim();
                            month = part2;
                            day = part3;
                            expiryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        }
                        
                        console.log(`📅 تحويل التاريخ: ${originalDate} -> ${expiryDate}`);
                    }
                } else if (expiryDate && !expiryDate.includes('-')) {
                    // إذا لم يكن بصيغة ISO ولا يحتوي على /
                    console.warn('⚠️ صيغة تاريخ غير معروفة:', expiryDate);
                }
                
                // التحقق من أن التاريخ ليس فارغاً
                if (!expiryDate) {
                    console.error('❌ تاريخ انتهاء مفقود للدواء:', item['اسم الدواء'] || item.name);
                    expiryDate = new Date().toISOString().split('T')[0]; // استخدام تاريخ اليوم كقيمة افتراضية
                }
                
                return {
                    name: item['اسم الدواء'] || item.name,
                    quantity: parseInt(item['الكمية'] || item.quantity) || 0,
                    price: parseFloat(item['السعر'] || item.price) || 0,
                    expiryDate: expiryDate,
                    company: item['الشركة'] || item.company || 'غير محدد',
                    category: item['الصنف'] || item.category || 'غير مصنف',
                    notes: item['ملاحظات'] || item.notes || ''
                };
            });

            // إضافة الأدوية المستوردة
            let successCount = 0;
            let failCount = 0;
            
            // استخدام Promise.all لانتظار كل الأدوية
            const importPromises = medicinesData.map(async (medicineData) => {
                try {
                    if (typeof addMedicineToSupabase === 'function') {
                        await addMedicineToSupabase(medicineData);
                        successCount++;
                    } else {
                        // إضافة محلية إذا لم يكن Supabase متاحاً
                        if (typeof medicines !== 'undefined') {
                            const newMedicine = {
                                id: Date.now(),
                                ...medicineData
                            };
                            medicines.push(newMedicine);
                            successCount++;
                        }
                    }
                } catch (error) {
                    console.error('❌ خطأ في إضالة الدواء:', medicineData.name, error);
                    failCount++;
                }
            });
            
            // انتظر حتى تخلص كل الأدوية
            await Promise.all(importPromises);
            
            // بعد ما خلصنا، حدث الجدول
            if (typeof showNotification === 'function') {
                if (failCount === 0) {
                    showNotification(`✅ تم استيراد ${successCount} دواء بنجاح`, 'success');
                } else {
                    showNotification(`✅ تم استيراد ${successCount} دواء | ❌ فشل ${failCount} دواء`, 'warning');
                }
            }
            
            // تحديث الجدول
            if (typeof loadMedicines === 'function') {
                await loadMedicines();
            }
            
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            if (typeof showNotification === 'function') {
                showNotification('حدث خطأ في استيراد البيانات. تأكد من صحة تنسيق الملف', 'error');
            }
        }
    };

    reader.readAsText(file);
    // إعادة تعيين المدخل
    event.target.value = '';
}

/**
 * تحليل سطر CSV مع دعم علامات الاقتباس
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // اقتباس مزدوج - إضافة اقتباس واحد
                current += '"';
                i++; // تخطي الاقتباس التالي
            } else {
                // تبديل حالة الاقتباس
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // فاصلة خارج الاقتباس - نهاية الحقل
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // إضافة الحقل الأخير
    result.push(current.trim());
    
    return result;
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addMedicine,
        updateMedicine,
        addCompany,
        editCompany,
        closeEditCompanyModal,
        updateCompany,
        deleteCompany,
        updateOrderStatus,
        recordPayment,
        recordPaymentOld,
        editMedicine,
        closeEditMedicineModal,
        deleteMedicine,
        exportMedicinesData,
        importMedicinesData,
        handleFileImport,
        parseCSVLine,
        incomingOrders
    };
}