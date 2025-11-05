/**
 * وظائف تحميل البيانات
 * يحتوي على جميع الوظائف المتعلقة بتحميل البيانات من قاعدة البيانات
 */

// ==================== البيانات من قاعدة البيانات ====================
let companies = [];
let medicines = [];
let orders = [];
let incomingOrders = [];
let allSystemCompanies = []; // New variable to store all system companies
let currentCompanyDetails = null; // تعريف المتغير لتخزين تفاصيل الشركة المحددة

/**
 * تحميل وعرض شركات الأدوية في الجدول
 */
async function loadCompanies() {
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;
    
    console.log('🔄 جاري تحميل الشركات...');
    
    // إظهار مؤشر التحميل في الجدول
    if (typeof showTableLoading === 'function') {
        showTableLoading('companiesTableBody', 'جاري تحميل الشركات...');
    }

    // محاولة تحميل البيانات من Supabase
    if (typeof getCompaniesFromSupabase === 'function') {
        const supabaseCompanies = await getCompaniesFromSupabase();
        console.log('📱 بيانات الشركات من Supabase:', supabaseCompanies);
        if (supabaseCompanies && supabaseCompanies.length > 0) {
            // تحميل الأدوية أولاً لحساب العدد لكل شركة
            let allMedicines = [];
            if (typeof getMedicinesFromSupabase === 'function') {
                const supabaseMedicines = await getMedicinesFromSupabase();
                if (supabaseMedicines && supabaseMedicines.length > 0) {
                    allMedicines = supabaseMedicines;
                }
            }
            
            companies = supabaseCompanies.map(comp => {
                // حساب عدد الأدوية المرتبطة بهذه الشركة
                const medicinesCount = allMedicines.filter(med => {
                    // التحقق من company_id أو اسم الشركة
                    return med.company_id === comp.id || 
                           (med.companies && med.companies.name === comp.name) ||
                           med.company === comp.name;
                }).length;
                
                return {
                    id: comp.id,
                    name: comp.name,
                    email: comp.email,
                    phone: comp.phone,
                    address: comp.address,
                    medicinesCount: medicinesCount
                };
            });
            console.log('📦 companies array updated with medicine counts:', companies);
        } else {
            console.log('📭 لا توجد شركات في قاعدة البيانات');
            companies = [];
        }
    }

    // التأكد من أن companies مصفوفة، وإذا لم تكن موجودة، تهيئتها
    if (!Array.isArray(companies)) {
        console.warn('companies ليس مصفوفة، تم تهيئته');
        companies = [];
    }
    
    console.log('📊 عدد الشركات لعرضها:', companies.length);
    
    // إذا لم يكن هناك شركات، لا نعرض شيء
    if (companies.length === 0) {
        console.log('لا توجد شركات للعرض');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-500">
                    <i class="fas fa-building text-3xl mb-3"></i>
                    <p>لا توجد شركات مسجلة</p>
                    <button onclick="openAddCompanyModal()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus ml-1"></i>إضافة شركة جديدة
                    </button>
                </td>
            </tr>
        `;
        // إخفاء مؤشر التحميل
        if (typeof hideTableLoading === 'function') {
            hideTableLoading('companiesTableBody');
        }
        return;
    }

    // تنظيف المحتوى الحالي
    tbody.innerHTML = '';

    companies.forEach(company => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        row.innerHTML = `
            <td data-label="اسم الشركة" class="py-4 px-6 font-medium text-gray-900">${company.name}</td>
            <td data-label="البريد الإلكتروني" class="py-4 px-6 text-gray-600">${company.email}</td>
            <td data-label="رقم التليفون" class="py-4 px-6 text-gray-600">${company.phone}</td>
            <td data-label="العنوان" class="py-4 px-6 text-gray-600">${company.address}</td>
            <td data-label="عدد الأدوية" class="py-4 px-6">
                <span class="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    ${company.medicinesCount} دواء
                </span>
            </td>
            <td data-label="الإجراءات" class="py-4 px-6">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editCompany('${company.id}')" class="text-blue-600 hover:text-blue-800 p-1">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCompany('${company.id}')" class="text-red-600 hover:text-red-800 p-1">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // إخفاء مؤشر التحميل
    if (typeof hideTableLoading === 'function') {
        hideTableLoading('companiesTableBody');
    }
    
    // تحديث الإحصائيات
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

/**
 * تحميل وعرض الأدوية في الجدول
 */
async function loadMedicines() {
    const tbody = document.getElementById('medicinesTableBody');
    if (!tbody) return;
    
    // إظهار مؤشر التحميل في الجدول
    if (typeof showTableLoading === 'function') {
        showTableLoading('medicinesTableBody', 'جاري تحميل الأدوية...');
    }

    // محاولة تحميل البيانات من Supabase
    if (typeof getMedicinesFromSupabase === 'function') {
        const supabaseMedicines = await getMedicinesFromSupabase();
        if (supabaseMedicines && supabaseMedicines.length > 0) {
            medicines = supabaseMedicines.map(med => ({
                id: med.id,
                name: med.name,
                englishName: med.english_name || '',
                quantity: med.quantity,
                price: med.price,
                expiryDate: med.expiry_date,
                company: med.companies ? med.companies.name : med.company || 'غير محدد',
                category: med.category || 'غير مصنف',
                notes: med.notes || '',
                barcode: med.international_barcode || '',
                stripQuantity: med.strip_quantity || 0,
                discountPercentage: med.discount_percentage || 0
            }));
        }
    }

    // التأكد من أن medicines مصفوفة، وإذا لم تكن موجودة، تهيئتها
    if (!Array.isArray(medicines)) {
        console.warn('medicines ليس مصفوفة، تم تهيئته');
        medicines = [];
    }
    
    // إذا لم يكن هناك أدوية، لا نعرض شيء
    if (medicines.length === 0) {
        console.log('لا توجد أدوية للعرض');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-gray-500">
                    <i class="fas fa-pills text-3xl mb-3"></i>
                    <p>لا توجد أدوية في المخزن</p>
                    <button onclick="openAddMedicineModal()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus ml-1"></i>إضافة دواء جديد
                    </button>
                </td>
            </tr>
        `;
        // إخفاء مؤشر التحميل
        if (typeof hideTableLoading === 'function') {
            hideTableLoading('medicinesTableBody');
        }
        return;
    }

    // ترتيب الأدوية أبجدياً حسب الاسم
    medicines.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ar');
    });

    // تنظيف المحتوى الحالي
    tbody.innerHTML = '';

    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        
        // تحديد لون الكمية حسب القيمة
        let quantityClass = '';
        let quantityBg = '';
        if (medicine.quantity === 0 || medicine.quantity < 10) {
            quantityClass = 'text-red-700';
            quantityBg = 'bg-red-50';
        } else if (medicine.quantity < 50) {
            quantityClass = 'text-orange-700';
            quantityBg = 'bg-orange-50';
        } else {
            quantityClass = 'text-green-700';
            quantityBg = 'bg-green-50';
        }
        
        // التحقق من تاريخ الانتهاء
        let expiryClass = 'text-gray-700';
        let expiryBg = 'bg-green-50';
        let expiryText = medicine.expiryDate || 'غير محدد';
        
        if (medicine.expiryDate) {
            const expiryDate = new Date(medicine.expiryDate);
            const today = new Date();
            const timeDiff = expiryDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                expiryClass = 'text-red-700';
                expiryBg = 'bg-red-50';
                expiryText = medicine.expiryDate;
            } else if (daysDiff <= 30) {
                expiryClass = 'text-orange-700';
                expiryBg = 'bg-orange-50';
                expiryText = medicine.expiryDate;
            } else if (daysDiff <= 90) {
                expiryClass = 'text-yellow-700';
                expiryBg = 'bg-yellow-50';
                expiryText = medicine.expiryDate;
            } else {
                expiryClass = 'text-green-700';
                expiryText = medicine.expiryDate;
            }
        }
        
        row.innerHTML = `
            <td class="py-3 px-4 text-gray-600">
                ${medicine.barcode || 'غير متوفر'}
            </td>
            <td class="py-3 px-4">
                <span class="font-medium text-gray-900 medicine-name">${medicine.name}</span>
                ${medicine.englishName ? `<div class="text-xs text-gray-500 mt-1 medicine-english-name">${medicine.englishName}</div>` : ''}
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-33 py-1 rounded-md ${quantityBg} ${quantityClass} font-medium text-sm">
                    ${medicine.quantity}
                </span>
                ${medicine.stripQuantity > 0 ? `<div class="text-xs text-gray-500 mt-1">${medicine.stripQuantity} شريط</div>` : ''}
            </td>
            <td class="py-3 px-4 text-gray-700 font-medium">
                ${formatCurrency(medicine.price)}
                ${medicine.discountPercentage > 0 ? `<div class="text-xs text-green-600 mt-1">-${medicine.discountPercentage}%</div>` : ''}
                ${medicine.discountPercentage > 0 ? `<div class="text-sm font-bold text-blue-600 mt-1">${formatCurrency(medicine.price * (1 - medicine.discountPercentage / 100))}</div>` : ''}
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-3 py-1 rounded-md ${expiryBg} ${expiryClass} font-medium text-sm">
                    ${expiryText}
                </span>
            </td>
            <td class="py-3 px-4 text-gray-600">
                ${medicine.company || 'غير محدد'}
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-md">
                    ${medicine.category}
                </span>
            </td>
            <td class="py-3 px-4">
                <div class="flex justify-center gap-2">
                    <button onclick="editMedicine('${medicine.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteMedicine('${medicine.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // إخفاء مؤشر التحميل
    if (typeof hideTableLoading === 'function') {
        hideTableLoading('medicinesTableBody');
    }
    
    // تحديث الإحصائيات
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
    
    // تحديث قائمة الشركات في الفلتر
    updateCompanyFilterOptions();
}

/**
 * تحديث قائمة الشركات في فلتر الشركات
 */
function updateCompanyFilterOptions() {
    const companyFilter = document.getElementById('companyFilter');
    if (!companyFilter) return;
    
    // تنظيف الخيارات الحالية
    companyFilter.innerHTML = '<option value="all">جميع الشركات</option>';
    
    // الحصول على قائمة الشركات من الأدوية
    if (typeof medicines !== 'undefined') {
        const companies = [...new Set(medicines.map(med => med.company).filter(company => company && company !== 'غير محدد'))];
        
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companyFilter.appendChild(option);
        });
    }
}

/**
 * تحميل وعرض الطلبات في الجدول (الطلبات المطلوبة/الصادرة)
 */
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    // إظهار مؤشر التحميل في الجدول
    if (typeof showTableLoading === 'function') {
        showTableLoading('ordersTableBody', 'جاري تحميل الطلبات...');
    }

    // محاولة تحميل البيانات من Supabase
    if (typeof getOrdersFromSupabase === 'function') {
        const supabaseOrders = await getOrdersFromSupabase();
        if (supabaseOrders && supabaseOrders.length > 0) {
            orders = supabaseOrders.map(ord => {
                // تحديد اسم المورد حسب نوعه
                let companyName = 'غير محدد';
                let companyId = null;
                
                if (ord.supplier_type === 'warehouse') {
                    // إذا كان المورد مخزن
                    companyName = ord.warehouse_users?.users?.name || 'مخزن غير محدد';
                    companyId = ord.warehouse_id;
                } else {
                    // إذا كان المورد شركة
                    companyName = ord.companies_users?.company_name || ord.companies_users?.users?.name || 'شركة غير محددة';
                    companyId = ord.company_id;
                }
                
                return {
                id: ord.id,
                orderNumber: ord.order_number,
                    companyId: companyId,
                    companyName: companyName,
                    supplierType: ord.supplier_type || 'company',
                date: ord.created_at,
                    amount: ord.final_amount ?? ord.total_amount, // المبلغ النهائي
                paymentMethod: ord.payment_method || 'غير محدد',
                status: ord.status,
                orderItems: ord.order_items || [],
                    itemsCount: ord.order_items ? ord.order_items.length : 0,
                    totalDiscount: ord.credit_deduction || 0, // قيمة الخصم
                    originalAmount: ord.total_amount // المبلغ الأصلي قبل الخصم
                };
            });
        } else {
            orders = [];
        }
    }

    // تحديث الإحصائيات
    updateOrdersStats();

    // تطبيق الفلاتر والبحث
    const filteredOrders = filterOrders(orders);

    // تنظيف المحتوى الحالي
    tbody.innerHTML = '';

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-gray-500">
                    <i class="fas fa-shopping-cart text-3xl mb-3"></i>
                    <p>لا توجد طلبات لعرضها</p>
                </td>
            </tr>
        `;
        if (typeof hideTableLoading === 'function') {
            hideTableLoading('ordersTableBody');
        }
        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.orderId = order.id;
        
        const statusInfo = getOrderStatusInfo(order.status);
        
        row.innerHTML = `
            <td class="py-3 px-4">
                <span class="font-medium text-gray-900">${order.orderNumber}</span>
            </td>
            <td class="py-3 px-4 text-gray-700 font-medium">${order.companyName}</td>
            <td class="py-3 px-4 text-gray-600">${formatDate(order.date)}</td>
            <td class="py-3 px-4 text-gray-900 font-medium">${formatCurrency(order.amount)}</td>
            <td class="py-3 px-4">
                <span class="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                    ${order.paymentMethod}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                    ${statusInfo.label}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                    ${order.itemsCount} دواء
                </span>
            </td>
            <td class="py-3 px-4">
                <div class="flex justify-center gap-2">
                    <button onclick="viewOrderDetails('${order.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${order.status !== 'shipped' && order.status !== 'delivered' ? `
                    <button onclick="editOrder('${order.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="تعديل الطلب">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // إخفاء مؤشر التحميل
    if (typeof hideTableLoading === 'function') {
        hideTableLoading('ordersTableBody');
    }
}


// تصدير الوظائف والبيانات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        companies,
        medicines,
        orders,
        loadCompanies,
        loadMedicines,
        loadOrders,
        loadCompaniesAndMedicines
    };
}

/**
 * تحميل وعرض الشركات والأدوية المتاحة للطلب
 */
async function loadCompaniesAndMedicines() {
    console.log('🔄 جاري تحميل الشركات والأدوية...');
    
    // إظهار مؤشر التحميل للشركات
    const companiesContainer = document.getElementById('companiesListContainer');
    if (companiesContainer) {
        companiesContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-3"></i>
                <p>جاري تحميل الشركات...</p>
            </div>
        `;
    }
    
    // إظهار رسالة افتراضية لتفاصيل الشركة
    const detailsContainer = document.getElementById('companyDetailsContainer');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-building text-3xl mb-3"></i>
                <p>اختر شركة من القائمة لعرض أدويةها</p>
            </div>
        `;
    }
    
    try {
        // جلب جميع الشركات (المستخدمين ذو الدور company)
        let allCompanies = [];
        if (typeof getAllCompaniesFromSupabase === 'function') {
            allCompanies = await getAllCompaniesFromSupabase();
            console.log('📱 بيانات الشركات من Supabase:', allCompanies);
        }
        
        // جلب جميع المخازن (المستخدمين ذو الدور warehouse)
        let allWarehouses = [];
        if (typeof getAllWarehousesFromSupabase === 'function') {
            allWarehouses = await getAllWarehousesFromSupabase();
            console.log('📦 بيانات المخازن من Supabase:', allWarehouses);
        }
        
        // تنظيم بيانات الشركات - ربط الأدوية بالشركات
        const companiesWithMedicines = allCompanies.map(company => {
            // استخدام company_medicines مباشرة من العلاقة
            const companyMedicines = company.company_medicines || [];
            // جلب الخصومات المتاحة
            const discounts = company.company_discounts || [];
            
            return {
                id: company.id, // companies_users.id - هذا هو المعرف الصحيح لـ company_id في الطلبات
                name: company.company_name || (company.users ? company.users.name : 'غير محدد'),
                email: company.users ? company.users.email : '',
                phone: company.phone || '',
                address: company.address || '',
                created_at: company.created_at,
                user_id: company.user_id, // users.id للشركة
                medicines: companyMedicines,
                discounts: discounts, // إضافة الخصومات
                users: company.users, // معلومات المستخدم للشركة
                type: 'company' // نوع: شركة
            };
        });
        
        // تنظيم بيانات المخازن - جلب أدوية كل مخزن
        const warehousesWithMedicines = await Promise.all(
            allWarehouses.map(async (warehouse) => {
                // جلب أدوية المخزن
                let warehouseMedicines = [];
                if (typeof getWarehouseMedicinesFromSupabase === 'function' && warehouse.users) {
                    warehouseMedicines = await getWarehouseMedicinesFromSupabase(warehouse.users.id);
                }
                
                // تحويل أدوية المخزن إلى نفس شكل أدوية الشركة
                const formattedMedicines = warehouseMedicines.map(med => ({
                    id: med.id,
                    name: med.name,
                    category: med.category || 'غير مصنف',
                    quantity: med.quantity,
                    price: med.price,
                    expiry_date: med.expiry_date,
                    notes: med.notes,
                    english_name: med.english_name,
                    international_barcode: med.international_barcode,
                    strip_quantity: med.strip_quantity
                }));
                
                return {
                    id: warehouse.id, // warehouse_users.id
                    name: warehouse.users ? warehouse.users.name : 'مخزن غير محدد',
                    email: warehouse.users ? warehouse.users.email : '',
                    phone: warehouse.users ? (warehouse.users.phone || warehouse.address || '') : '',
                    address: warehouse.address || '',
                    created_at: warehouse.created_at,
                    user_id: warehouse.user_id, // users.id للمخزن
                    medicines: formattedMedicines,
                    discounts: [], // المخازن لا تحتوي على خصومات حالياً
                    users: warehouse.users, // معلومات المستخدم للمخزن
                    type: 'warehouse' // نوع: مخزن
                };
            })
        );
        
        // دمج الشركات والمخازن في قائمة واحدة
        const allSuppliers = [...companiesWithMedicines, ...warehousesWithMedicines];
        
        // إذا لم توجد شركات أو مخازن
        if (allSuppliers.length === 0) {
            if (companiesContainer) {
                companiesContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-building text-3xl mb-3"></i>
                        <p>لا توجد شركات أو مخازن مسجلة في النظام</p>
                    </div>
                `;
            }
            allSystemCompanies = [];
            return;
        }
        
        // تخزين الشركات والمخازن العالمية
        allSystemCompanies = allSuppliers;
        
        // عرض قائمة الشركات والمخازن
        renderCompaniesList(allSuppliers);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الشركات والأدوية:', error);
        if (companiesContainer) {
            companiesContainer.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-3"></i>
                    <p>حدث خطأ أثناء تحميل الشركات والأدوية</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * عرض قائمة الشركات
 * @param {Array} companies - قائمة الشركات
 */
function renderCompaniesList(companies) {
    const container = document.getElementById('companiesListContainer');
    if (!container) return;

    if (companies.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-gray-500">
                <i class="fas fa-building text-3xl mb-3"></i>
                <p>لا توجد شركات مسجلة في النظام</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';

    // عرض كل شركة أو مخزن
    companies.forEach(company => {
        const companyItem = document.createElement('div');
        companyItem.className = 'p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors company-item';
        companyItem.dataset.companyId = company.id;
        companyItem.onclick = () => selectCompany(company);
        
        // تحديد الأيقونة والنوع حسب نوع المورد
        const icon = company.type === 'warehouse' ? 'fa-warehouse' : 'fa-building';
        const typeLabel = company.type === 'warehouse' ? 'مخزن' : 'شركة';
        const iconBg = company.type === 'warehouse' ? 'bg-green-100' : 'bg-gray-100';
        const iconColor = company.type === 'warehouse' ? 'text-green-500' : 'text-gray-500';
        
        companyItem.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas ${icon} ${iconColor}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-800 truncate">${company.name}</h4>
                    <p class="text-xs text-gray-500 mt-0.5">${typeLabel}</p>
                </div>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">${company.medicines.length}</span>
            </div>
        `;
        container.appendChild(companyItem);
    });
}
/**
 * اختيار شركة وعرض تفاصيلها وأدويةها
 * @param {Object} company - بيانات الشركة
 */
function selectCompany(company) {
    // تحديث حالة العناصر المحددة
    document.querySelectorAll('.company-item').forEach(item => { 
        item.classList.remove('bg-blue-50', 'border-blue-500', 'shadow-md');
        item.classList.add('border-gray-200', 'hover:bg-gray-50');
    });
    
    // تمييز الشركة المحددة
    const selectedItem = document.querySelector(`.company-item[data-company-id="${company.id}"]`); 
    if (selectedItem) {
        selectedItem.classList.remove('border-gray-200', 'hover:bg-gray-50');
        selectedItem.classList.add('bg-blue-50', 'border-blue-500', 'shadow-md');
    }

    // تخزين تفاصيل الشركة الحالية للاستخدام عند إنشاء الطلب
    currentCompanyDetails = company;
    renderCompanyDetails(company);
}

/**
 * @param {Object} company - بيانات الشركة
 */
function renderCompanyDetails(company) {
    const container = document.getElementById('companyDetailsContainer');
    if (!container) return;
    
    // معلومات الشركة
    let medicinesTable;
    // إذا لم توجد أدوية
    if (!company.medicines || company.medicines.length === 0) {
        medicinesTable = `
            <div class="text-center p-12 text-gray-500">
                <i class="fas fa-pills text-3xl mb-3"></i>
                <p>لا توجد أدوية متاحة من هذه الشركة</p>
            </div>
        `;
    } else {
        let medicineRows = '';
        company.medicines.forEach(medicine => {
            const price = parseFloat(medicine.price) || 0;
            const discount = parseFloat(medicine.discount_percentage) || 0;
            const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
            const englishName = medicine.english_name || '';

            medicineRows += `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4">
                        <input type="checkbox" 
                               class="medicine-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                               data-medicine-id="${medicine.id}"
                               data-medicine-name="${medicine.name}"
                               data-medicine-price="${discountedPrice}" 
                               data-medicine-max-quantity="${medicine.quantity}"
                               data-english-name="${englishName}">
                    </td>
                    <td class="py-3 px-4">
                        <span class="font-medium text-gray-800 medicine-name">${medicine.name}</span>
                        ${englishName ? `<div class="text-xs text-gray-500 mt-1 medicine-english-name">${englishName}</div>` : ''}
                    </td>
                    <td class="py-3 px-4 text-gray-600">${medicine.category || 'غير مصنف'}</td>
                    <td class="py-3 px-4 text-gray-600">${medicine.quantity}</td>
                    <td class="py-3 px-4">
                        <div class="flex flex-col">
                            <span class="font-semibold text-blue-600">${formatCurrency(discountedPrice)}</span>
                            ${discount > 0 ? `<span class="text-xs text-gray-500 line-through">${formatCurrency(price)}</span>` : ''}
                        </div>
                    </td>
                    <td class="py-3 px-4 text-gray-600">${formatDate(medicine.expiry_date)}</td>
                    <td class="py-3 px-4">
                        <input type="number" min="1" max="${medicine.quantity}" value="1" class="medicine-quantity w-20 border border-gray-300 rounded-md px-2 py-1 text-center" data-medicine-id="${medicine.id}" style="display: none;">
                    </td>
                </tr>
            `;
        });
        medicinesTable = `
            <div class="overflow-x-auto">
            <div class="overflow-x-auto max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200">
                        <tr class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">
                                <input type="checkbox" id="selectAllCompanyMedicines" onchange="toggleAllMedicines(this.checked, 'companyMedicinesTable')" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            </th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">الدواء</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">الصنف</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">المتاح</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">السعر</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">الانتهاء</th>
                            <th class="py-3 px-4 text-right font-semibold text-gray-600">الكمية المطلوبة</th>
                        </tr>
                    </thead>
                    <tbody id="companyMedicinesTable" class="divide-y divide-gray-100">${medicineRows}</tbody>
                </table>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="p-6 border-b border-gray-200 bg-gray-50">
            <h3 class="text-xl font-bold text-gray-900 mb-4">${company.name}</h3>
            <div class="space-y-2">
                ${company.phone ? `
                    <div class="flex items-center gap-2 text-gray-700">
                        <i class="fas fa-phone text-blue-600"></i>
                        <span class="text-sm">${company.phone}</span>
                    </div>
                ` : ''}
                ${company.address ? `
                    <div class="flex items-start gap-2 text-gray-700">
                        <i class="fas fa-map-marker-alt text-blue-600 mt-1"></i>
                        <span class="text-sm">${company.address}</span>
                    </div>
                ` : ''}
                ${company.email ? `
                    <div class="flex items-center gap-2 text-gray-700">
                        <i class="fas fa-envelope text-blue-600"></i>
                        <span class="text-sm">${company.email}</span>
                    </div>
                ` : ''}
            </div>
            
            ${company.type === 'company' ? `
            <!-- عرض الرصيد المتاح -->
            <div class="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 mb-1">الرصيد المتاح لدى ${company.name}</p>
                        <p class="text-2xl font-bold text-green-600" id="availableCreditDisplay-${company.id}">جاري التحميل...</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-wallet text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>` : ''}
        </div>
        <div class="p-6 border-b border-gray-200">
            <div class="relative">
                <input type="text" 
                       id="companyMedicineSearchInput" 
                       onkeyup="filterMedicinesInCompany()" 
                       placeholder="ابحث عن دواء بالاسم العربي أو الإنجليزي..." 
                       class="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
        </div>
        <div class="p-6">
            ${medicinesTable}
        </div>
        ${(company.medicines && company.medicines.length > 0) ? `
        <div class="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button onclick="createOrderFromSelectedMedicines()" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
                <i class="fas fa-shopping-cart ml-2"></i> طلب الأدوية المحددة
            </button>
        </div>` : ''}
    `;
    
    // جلب وعرض الرصيد المتاح إذا كانت شركة
    if (company.type === 'company' && typeof getUserCompanyCredit === 'function') {
        const user = getCurrentUser();
        if (user) {
            getUserCompanyCredit(user.id, company.id)
                .then(credit => {
                    const creditEl = document.getElementById(`availableCreditDisplay-${company.id}`);
                    if (creditEl) {
                        creditEl.textContent = formatCurrency(credit);
                    }
                })
                .catch(error => {
                    console.error('❌ خطأ في جلب الرصيد:', error);
                    const creditEl = document.getElementById(`availableCreditDisplay-${company.id}`);
                    if (creditEl) {
                        creditEl.textContent = '0.00 جنيه';
                    }
                });
        }
    }
    // إضافة مستمعي الأحداث للـ checkboxes بعد إنشاء الجدول
    if (company.medicines && company.medicines.length > 0) {
        document.querySelectorAll('#companyMedicinesTable .medicine-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const medicineId = this.dataset.medicineId;
                const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
                
                if (this.checked) {
                    if (quantityInput) {
                        quantityInput.style.display = 'block';
                    }
                } else {
                    if (quantityInput) {
                        quantityInput.style.display = 'none';
                    }
                }
                
                // تحديث حالة زر تحديد الكل
                const selectAllCheckbox = document.getElementById('selectAllCompanyMedicines');
                const tableBody = document.getElementById('companyMedicinesTable');
                if (selectAllCheckbox && tableBody) {
                    updateSelectAllState(selectAllCheckbox, tableBody);
                }
            });
        });
    }

    // إعادة ربط الأحداث بعد تحديث الـ DOM
    setupMedicineSelectionListeners();
}

/**
 * تصفية الأدوية داخل الشركة المحددة بناءً على البحث
 */
function filterMedicinesInCompany() {
    const input = document.getElementById('companyMedicineSearchInput');
    const filter = input.value.toLowerCase();
    const tableBody = document.getElementById('companyMedicinesTable');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const arabicNameEl = rows[i].querySelector('.medicine-name');
        const englishNameEl = rows[i].querySelector('.medicine-english-name');
        
        if (arabicNameEl) {
            const arabicName = arabicNameEl.textContent.toLowerCase();
            const englishName = englishNameEl ? englishNameEl.textContent.toLowerCase() : '';
            
            if (arabicName.includes(filter) || englishName.includes(filter)) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    // تحديث حالة زر "تحديد الكل" بعد التصفية
    const selectAllCheckbox = document.getElementById('selectAllCompanyMedicines');
    updateSelectAllState(selectAllCheckbox, tableBody);
}

/**
 * تحميل وعرض الطلبات الواردة في الجدول
 */
async function loadIncomingOrders() {
    const tbody = document.getElementById('incomingOrdersTableBody');
    if (!tbody) return;
    
    // إظهار مؤشر التحميل في الجدول
    if (typeof showTableLoading === 'function') {
        showTableLoading('incomingOrdersTableBody', 'جاري تحميل الطلبات الواردة...');
    }
    
    // محاولة تحميل البيانات من Supabase
    if (typeof getIncomingOrdersFromSupabase === 'function') {
        const supabaseOrders = await getIncomingOrdersFromSupabase();
        if (supabaseOrders && supabaseOrders.length > 0) {
            incomingOrders = supabaseOrders.map(ord => ({
                id: ord.id,
                orderNumber: ord.order_number,
                pharmacy: ord.users?.name || ord.user_id || 'غير محدد',
                pharmacyEmail: ord.users?.email || '',
                date: ord.created_at,
                amount: ord.total_amount,
                paymentMethod: ord.payment_method || 'غير محدد',
                status: ord.status,
                orderItems: ord.order_items || [],
                itemsCount: ord.order_items ? ord.order_items.length : 0
            }));
        } else {
            incomingOrders = [];
        }
    }

    // تحديث الإحصائيات
    if (typeof updateIncomingOrdersStats === 'function') {
        updateIncomingOrdersStats();
    }

    // تطبيق الفلاتر والبحث
    const filteredOrders = typeof filterIncomingOrders === 'function' 
        ? filterIncomingOrders(incomingOrders) 
        : incomingOrders;

    // تنظيف المحتوى الحالي
    tbody.innerHTML = '';

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-3"></i>
                    <p>لا توجد طلبات واردة لعرضها</p>
                </td>
            </tr>
        `;
        if (typeof hideTableLoading === 'function') {
            hideTableLoading('incomingOrdersTableBody');
        }
        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.orderId = order.id;
        
        const statusInfo = typeof getOrderStatusInfo === 'function' 
            ? getOrderStatusInfo(order.status) 
            : { label: order.status, class: 'bg-gray-100 text-gray-800' };
        
        row.innerHTML = `
            <td class="py-3 px-4">
                <span class="font-medium text-gray-900">${order.orderNumber}</span>
            </td>
            <td class="py-3 px-4 text-gray-700 font-medium">${order.pharmacy}</td>
            <td class="py-3 px-4 text-gray-600">${formatDate(order.date)}</td>
            <td class="py-3 px-4 text-gray-900 font-medium">${formatCurrency(order.amount)}</td>
            <td class="py-3 px-4">
                <span class="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                    ${order.paymentMethod}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                    ${statusInfo.label}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                    ${order.itemsCount} دواء
                </span>
            </td>
            <td class="py-3 px-4">
                <div class="flex justify-center gap-2">
                    <button onclick="viewOrderDetails('${order.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <select onchange="updateIncomingOrderStatus('${order.id}', this.value)" 
                            class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            title="تغيير حالة الطلب">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد المعالجة</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // إخفاء مؤشر التحميل
    if (typeof hideTableLoading === 'function') {
        hideTableLoading('incomingOrdersTableBody');
    }
}

/**
 * تحميل جميع الشركات المسجلة في النظام
 */
async function loadAllSystemCompanies() {
    // محاولة تحميل البيانات من Supabase
    if (typeof getAllCompaniesFromSupabase === 'function') {
        const supabaseCompanies = await getAllCompaniesFromSupabase();
        if (supabaseCompanies && supabaseCompanies.length > 0) {
            allSystemCompanies = supabaseCompanies;
        } else {
            allSystemCompanies = [];
        }
    }
    
    // تحديث الإحصائيات
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

/**
 * عرض تفاصيل الشركة
 * @param {string} companyId - معرف الشركة
 */
function showCompanyDetails(companyId) {
    // البحث عن الشركة المحددة
    const company = allSystemCompanies.find(c => c.id === companyId);
    if (!company) {
        alert('لم يتم العثور على الشركة المحددة.');
        return;
    }
    
    // تخزين تفاصيل الشركة الحالية
    currentCompanyDetails = company;
    
    // ملء معلومات الشركة
    document.getElementById('companyDetailName').textContent = company.users ? company.users.name : 'غير محدد';
    document.getElementById('companyDetailCompanyName').textContent = company.users ? company.users.name : 'غير محدد';
    document.getElementById('companyDetailEmail').textContent = company.users ? company.users.email : 'لا يوجد';
    document.getElementById('companyDetailPhone').textContent = company.phone || 'لا يوجد';
    document.getElementById('companyDetailAddress').textContent = company.address || 'لا يوجد';
    document.getElementById('companyMedicinesCount').textContent = company.medicines ? company.medicines.length : 0;
    
    // عرض أدوية الشركة
    renderCompanyMedicines(company.medicines || []);
    
    // عرض صفحة تفاصيل الشركة
    showPage('company-details');
}

/**
 * عرض أدوية الشركة في الجدول
 * @param {Array} medicines - قائمة الأدوية
 */
function renderCompanyMedicines(medicines) {
    const tbody = document.getElementById('companyMedicinesTableBody');
    if (!tbody) return;
    
    // إذا لم توجد أدوية
    if (!medicines || medicines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-pills text-3xl mb-3"></i>
                    <p>لا توجد أدوية متاحة من هذه الشركة</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // تنظيف المحتوى الحالي
    tbody.innerHTML = '';
    
    // عرض كل دواء
    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        row.innerHTML = `
            <td data-label="تحديد" class="py-3 px-4">
                <input type="checkbox" 
                       class="medicine-checkbox" 
                       data-medicine-id="${medicine.id}"
                       data-medicine-name="${medicine.name}"
                       data-medicine-price="${medicine.price}"
                       data-medicine-max-quantity="${medicine.quantity}">
            </td>
            <td data-label="اسم الدواء" class="py-3 px-4 font-medium text-gray-900">${medicine.name}</td>
            <td data-label="الصنف" class="py-3 px-4 text-gray-600">${medicine.category || 'غير مصنف'}</td>
            <td data-label="الكمية المتوفرة" class="py-3 px-4 text-gray-600">${medicine.quantity} قطعة</td>
            <td data-label="السعر للوحدة" class="py-3 px-4 text-gray-900 font-medium">${medicine.price} جنيه</td>
            <td data-label="تاريخ الانتهاء" class="py-3 px-4 text-gray-600">${formatDate(medicine.expiry_date)}</td>
            <td data-label="الكمية المطلوبة" class="py-3 px-4">
                <input type="number" 
                       min="1" 
                       max="${medicine.quantity}" 
                       value="1"
                       class="medicine-quantity w-20 border border-gray-300 rounded px-2 py-1 text-center"
                       data-medicine-id="${medicine.id}"
                       style="display: none;">
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث لcheckboxes
    document.querySelectorAll('.medicine-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const medicineId = this.dataset.medicineId;
            const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
            
            if (this.checked) {
                quantityInput.style.display = 'block';
            } else {
                quantityInput.style.display = 'none';
            }
            
            // تحديث حالة زر تحديد الكل
            const selectAllCheckbox = document.getElementById('selectAllCompanyMedicines');
            const tableBody = document.getElementById('companyMedicinesTable');
            if (selectAllCheckbox && tableBody) {
                updateSelectAllState(selectAllCheckbox, tableBody);
            }
        });
    });
}

/**
 * إعداد مستمعي الأحداث لتحديد الأدوية
 */
function setupMedicineSelectionListeners() {
    document.querySelectorAll('.medicine-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const medicineId = this.dataset.medicineId;
            const quantityInput = document.querySelector(`.medicine-quantity[data-medicine-id="${medicineId}"]`);
            
            if (this.checked) {
                quantityInput.style.display = 'block';
            } else {
                quantityInput.style.display = 'none';
            }
            
            // تحديث حالة زر تحديد الكل
            const selectAllCheckbox = document.getElementById('selectAllCompanyMedicines');
            const tableBody = document.getElementById('companyMedicinesTable');
            if (selectAllCheckbox && tableBody) {
                updateSelectAllState(selectAllCheckbox, tableBody);
            }
        });
    });
}

/**
 * تحديد أو إلغاء تحديد جميع الأدوية
 * @param {boolean} checked - حالة التحديد
 */
function toggleAllMedicines(checked, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    tableBody.querySelectorAll('.medicine-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
        
        const medicineId = checkbox.dataset.medicineId;
        const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
        
        if (quantityInput) {
            quantityInput.style.display = checked ? 'block' : 'none';
        }
    });
}

/**
 * تحديث حالة زر تحديد الكل
 */
function updateSelectAllState(selectAllCheckbox, tableBody) {
    if (!selectAllCheckbox || !tableBody) return;

    const allCheckboxes = tableBody.querySelectorAll('.medicine-checkbox');
    const checkedCheckboxes = tableBody.querySelectorAll('.medicine-checkbox:checked');
    
    if (allCheckboxes.length === checkedCheckboxes.length && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

/**
 * إنشاء طلب من شركة معينة
 * @param {string} companyId - معرف الشركة
 */
function createOrderFromCompany(companyId) {
    console.log('إنشاء طلب من الشركة:', companyId);
    
    // البحث عن الشركة المحددة
    let company = allSystemCompanies.find(c => c.id === companyId);
    
    // إذا لم نجد الشركة في القائمة الشاملة، نحاول البحث في قائمة الشركات الحالية
    if (!company && typeof currentCompanyDetails !== 'undefined' && currentCompanyDetails && currentCompanyDetails.id === companyId) {
        company = currentCompanyDetails;
    }
    
    if (!company) {
        alert('لم يتم العثور على الشركة المحددة.');
        return;
    }
    
    // الحصول على الأدوية المتاحة من هذه الشركة
    const companyMedicines = company.medicines || [];
    if (companyMedicines.length === 0) {
        alert('لا توجد أدوية متاحة من هذه الشركة.');
        return;
    }
    
    // إنشاء نموذج لاختيار الأدوية والكميات
    createOrderForm(company, companyMedicines);
}

/**
 * فتح نموذج إنشاء الطلب
 */
function openCreateOrderModal() {
    if (!currentCompanyDetails) {
        alert('لا توجد شركة محددة.');
        return;
    }
    
    // الحصول على الأدوية المتاحة من هذه الشركة
    const companyMedicines = currentCompanyDetails.medicines || [];
    if (companyMedicines.length === 0) {
        alert('لا توجد أدوية متاحة من هذه الشركة.');
        return;
    }
    
    // إنشاء نموذج لاختيار الأدوية والكميات
    createOrderForm(currentCompanyDetails, companyMedicines);
}

/**
 * إنشاء نموذج لإنشاء طلب جديد
 * @param {Object} company - بيانات الشركة
 * @param {Array} medicines - أدوية الشركة
 */
function createOrderForm(company, medicines) {
    // إنشاء عنصر نموذج
    const formContainer = document.createElement('div');
    formContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    formContainer.id = 'orderFormContainer';
    
    // إنشاء محتوى النموذج
    let medicinesOptions = '';
    medicines.forEach(medicine => {
        medicinesOptions += `
            <div class="border border-gray-200 rounded-lg p-4 mb-3">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium text-gray-900">${medicine.name}</h4>
                        <p class="text-sm text-gray-600">${medicine.category || 'غير مصنف'}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">${medicine.price} جنيه</p>
                        <p class="text-sm text-gray-600">متوفر: ${medicine.quantity} قطعة</p>
                    </div>
                </div>
                <div class="mt-3 flex items-center">
                    <label class="mr-3 text-sm font-medium text-gray-700">الكمية:</label>
                    <input type="number" 
                           name="quantity_${medicine.id}" 
                           min="1" 
                           max="${medicine.quantity}" 
                           value="1"
                           class="w-20 border border-gray-300 rounded px-3 py-1 text-center"
                           data-price="${medicine.price}"
                           data-name="${medicine.name}"
                           data-id="${medicine.id}">
                </div>
            </div>
        `;
    });
    
    formContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">إنشاء طلب جديد من ${company.users ? company.users.name : company.name}</h3>
                    <button onclick="closeOrderForm()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">معلومات الشركة</h4>
                    <p class="text-sm text-gray-600">${company.users ? company.users.name : company.name}</p>
                    ${company.users && company.users.email ? `<p class="text-sm text-gray-600">${company.users.email}</p>` : ''}
                    ${company.phone ? `<p class="text-sm text-gray-600">${company.phone}</p>` : ''}
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">اختر الأدوية والكميات:</h4>
                    ${medicinesOptions}
                </div>
                
                <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                        <p class="text-lg font-bold text-gray-900">المجموع: <span id="totalAmount">0</span> جنيه</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeOrderForm()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            إلغاء
                        </button>
                        <button onclick="submitOrder('${company.id}')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            إنشاء الطلب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الصفحة
    document.body.appendChild(formContainer);
    
    // إضافة مستمعي الأحداث لتحديث المجموع
    const quantityInputs = formContainer.querySelectorAll('input[type="number"]');
    quantityInputs.forEach(input => {
        input.addEventListener('input', updateOrderTotal);
    });
    
    // تحديث المجموع الأولي
    updateOrderTotal();
}

/**
 * تحديث المجموع الإجمالي للطلب
 */
function updateOrderTotal() {
    const container = document.getElementById('orderFormContainer');
    if (!container) return;
    
    const quantityInputs = container.querySelectorAll('input[type="number"]');
    let total = 0;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        const price = parseFloat(input.dataset.price) || 0;
        total += quantity * price;
    });
    
    const totalElement = container.querySelector('#totalAmount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

/**
 * إغلاق نموذج الطلب
 */
function closeOrderForm() {
    const formContainer = document.getElementById('orderFormContainer');
    if (formContainer) {
        formContainer.remove();
    }
}

/**
 * إرسال الطلب
 * @param {string} companyId - معرف الشركة
 */
async function submitOrder(companyId) {
    const container = document.getElementById('orderFormContainer');
    if (!container) return;
    
    // جمع بيانات الأدوية المحددة
    const quantityInputs = container.querySelectorAll('input[type="number"]');
    const orderItems = [];
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            const medicineId = input.dataset.id;
            const medicineName = input.dataset.name;
            const unitPrice = parseFloat(input.dataset.price);
            const totalPrice = quantity * unitPrice;
            
            orderItems.push({
                medicine_id: medicineId,
                medicine_name: medicineName,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }
    });
    
    // التحقق من وجود أدوية محددة
    if (orderItems.length === 0) {
        alert('يرجى اختيار دواء واحد على الأقل.');
        return;
    }
    
    // إظهار مؤشر التحميل
    const submitButton = container.querySelector('button[onclick*="submitOrder"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>جاري الإنشاء...';
    submitButton.disabled = true;
    
    try {
        // التحقق من صحة معرف الشركة
        if (!companyId) {
            alert('معرف الشركة غير صحيح. يرجى المحاولة مرة أخرى.');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            return;
        }

        console.log('🔄 جاري إرسال الطلب للشركة:', companyId);
        console.log('📋 بيانات الأدوية المحددة:', orderItems);

        // إنشاء بيانات الطلب
        const orderData = {
            companyId: companyId, // companies_users.id
            paymentMethod: null // سيتم تحديده لاحقاً
        };
        
        // محاولة إضافة الطلب إلى Supabase
        if (typeof addOrderToSupabase === 'function') {
            const result = await addOrderToSupabase(orderData, orderItems);
            if (result) {
                console.log('✅ تم إرسال الطلب بنجاح للشركة:', companyId);
                
                // إغلاق النموذج
                closeOrderForm();
                
                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    showNotification(`تم إرسال الطلب بنجاح للشركة. رقم الطلب: ${result.order_number}`, 'success');
                }
                
                // إعادة تحميل قائمة الشركات والأدوية
                if (typeof loadCompaniesAndMedicines === 'function') {
                    await loadCompaniesAndMedicines();
                }
                
                // إعادة تحميل الطلبات إذا كنا في صفحة الطلبات
                if (typeof loadOrders === 'function') {
                    await loadOrders();
                }
                
                // إعادة تحميل الطلبات الواردة
                if (typeof loadIncomingOrders === 'function') {
                    await loadIncomingOrders();
                }
                
                return;
            }
        }
        
        // إذا فشلت إضافة الطلب إلى Supabase
        alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        const errorMessage = error.message || 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.';
        alert(errorMessage);
        
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
    } finally {
        // إخفاء مؤشر التحميل
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

/**
 * إنشاء طلب من الأدوية المحددة
 */
function createOrderFromSelectedMedicines() {
    if (!currentCompanyDetails) {
        alert('لا توجد شركة محددة.');
        return;
    }
    
    // جمع الأدوية المحددة
    const selectedMedicines = [];
    const checkboxes = document.querySelectorAll('#companyMedicinesTable .medicine-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('يرجى تحديد دواء واحد على الأقل.');
        return;
    }
    
    let hasErrors = false;
    
    checkboxes.forEach(checkbox => {
        const medicineId = checkbox.dataset.medicineId;
        const medicineName = checkbox.dataset.medicineName;
        const medicinePrice = parseFloat(checkbox.dataset.medicinePrice);
        const maxQuantity = parseInt(checkbox.dataset.medicineMaxQuantity);
        
        const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
        const quantity = parseInt(quantityInput.value) || 1;
        
        // التحقق من صحة الكمية
        if (quantity < 1 || quantity > maxQuantity) {
            alert(`الكمية المطلوبة للدواء "${medicineName}" يجب أن تكون بين 1 و ${maxQuantity}`);
            hasErrors = true;
            return;
        }
        
        selectedMedicines.push({
            id: medicineId,
            name: medicineName,
            price: medicinePrice,
            quantity: quantity,
            total: medicinePrice * quantity
        });
    });
    
    // إذا كانت هناك أخطاء أو لم توجد أدوية صحيحة
    if (hasErrors || selectedMedicines.length === 0) {
        return;
    }
    
    // إنشاء طلب من الأدوية المحددة
    createOrderFromSelectedMedicinesList(currentCompanyDetails, selectedMedicines);
}

/**
 * إنشاء طلب من قائمة الأدوية المحددة
 * @param {Object} company - بيانات الشركة
 * @param {Array} selectedMedicines - قائمة الأدوية المحددة
 */
function createOrderFromSelectedMedicinesList(company, selectedMedicines) {
    // تحويل قائمة الأدوية المحددة إلى التنسيق المطلوب للطلب
    const orderItems = selectedMedicines.map(medicine => ({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: medicine.quantity,
        unit_price: medicine.price,
        total_price: medicine.total
    }));
    
    // إنشاء بيانات الطلب
    const orderData = {
        companyId: company.id
    };
    
    // عرض نموذج الطلب مع الأدوية المحددة
    showOrderSummaryModal(company, selectedMedicines, orderData, orderItems);
}

/**
 * عرض ملخص الطلب في نافذة منبثقة
 * @param {Object} company - بيانات الشركة
 * @param {Array} selectedMedicines - قائمة الأدوية المحددة
 * @param {Object} orderData - بيانات الطلب
 * @param {Array} orderItems - عناصر الطلب
 */
function showOrderSummaryModal(company, selectedMedicines, orderData, orderItems) {
    // حساب المجموع الإجمالي
    const totalAmount = selectedMedicines.reduce((sum, medicine) => sum + medicine.total, 0);
    
    // تطبيق الخصومات إذا كانت متاحة
    const discounts = company.discounts || [];
    let discountResult = null;
    
    console.log('🎁 الخصومات المتاحة للشركة:', discounts);
    console.log('📦 الأدوية المحددة:', selectedMedicines);
    console.log('🔍 تفاصيل الخصومات:', discounts.map(d => ({
        id: d.id,
        type: d.discount_type,
        name: d.name,
        buy_quantity: d.buy_quantity,
        get_quantity: d.get_quantity,
        medicine_id: d.medicine_id,
        is_active: d.is_active
    })));
    
    if (discounts && discounts.length > 0 && typeof applyDiscounts === 'function') {
        // تحويل الأدوية إلى التنسيق المطلوب لتطبيق الخصومات
        const medicinesForDiscount = selectedMedicines.map(m => ({
            id: m.id,
            name: m.name,
            quantity: m.quantity,
            price: m.price,
            total: m.total
        }));
        
        console.log('🔄 تطبيق الخصومات على:', medicinesForDiscount);
        console.log('🔄 مقارنة معرفات الأدوية:', {
            selectedMedicines: selectedMedicines.map(m => ({ id: m.id, name: m.name })),
            discounts: discounts.map(d => ({ medicine_id: d.medicine_id, type: d.discount_type }))
        });
        
        discountResult = applyDiscounts(medicinesForDiscount, discounts, totalAmount);
        console.log('✅ نتيجة الخصومات:', discountResult);
        console.log('✅ appliedDiscounts:', discountResult?.appliedDiscounts);
        console.log('✅ medicinesWithDiscounts:', discountResult?.medicinesWithDiscounts);
    }
    
    const finalAmount = discountResult ? discountResult.finalAmount : totalAmount;
    const totalDiscount = discountResult ? discountResult.totalDiscount : 0;
    
    // إنشاء عنصر نموذج
    const formContainer = document.createElement('div');
    formContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    formContainer.id = 'orderSummaryContainer';
    
    // حفظ نتيجة الخصومات في dataset
    if (discountResult) {
        formContainer.dataset.discountResult = JSON.stringify(discountResult);
    }
    
    // إنشاء محتوى الملخص
    let medicinesList = '';
    selectedMedicines.forEach(medicine => {
        const medicineForDiscount = discountResult && discountResult.medicinesWithDiscounts 
            ? discountResult.medicinesWithDiscounts.find(m => {
                // مقارنة معرفات الأدوية (يمكن أن تكون UUID أو نصوص)
                const match = m.id === medicine.id || 
                             m.id?.toString() === medicine.id?.toString() ||
                             String(m.id) === String(medicine.id);
                return match;
            })
            : null;
        
        console.log('🔍 الدواء:', medicine.name, 'ID:', medicine.id);
        console.log('🔍 medicineForDiscount:', medicineForDiscount);
        console.log('🔍 discountResult.appliedDiscounts:', discountResult?.appliedDiscounts);
        
        const displayPrice = medicineForDiscount && medicineForDiscount.discountedTotal !== undefined 
            ? medicineForDiscount.discountedTotal 
            : medicine.total;
        const originalPrice = medicine.total;
        const hasDiscount = medicineForDiscount && medicineForDiscount.discountedTotal !== undefined;
        const discountAmount = medicineForDiscount && medicineForDiscount.discountAmount ? medicineForDiscount.discountAmount : 0;
        
        // الحصول على الكمية المجانية من medicineForDiscount أو من appliedDiscounts
        let freeQuantity = 0;
        let originalQuantity = medicine.quantity; // الكمية المطلوبة (المدفوعة)
        
        // أولاً: البحث في medicinesWithDiscounts مباشرة (هذا أكثر موثوقية)
        if (medicineForDiscount && medicineForDiscount.freeQuantity !== undefined && medicineForDiscount.freeQuantity !== null) {
            freeQuantity = medicineForDiscount.freeQuantity;
            console.log('✅ وجدت freeQuantity في medicineForDiscount:', freeQuantity);
            // إذا كان هناك originalQuantity محفوظ، استخدمه
            if (medicineForDiscount.originalQuantity !== undefined) {
                originalQuantity = medicineForDiscount.originalQuantity;
            }
        }
        
        // ثانياً: البحث في appliedDiscounts إذا لم نجد في medicineForDiscount
        if (freeQuantity === 0 && discountResult && discountResult.appliedDiscounts && discountResult.appliedDiscounts.length > 0) {
            console.log('🔍 البحث في appliedDiscounts:', discountResult.appliedDiscounts);
            
            // البحث عن خصم buy_get يحتوي على معرف الدواء أو اسم الدواء
            const buyGetDiscount = discountResult.appliedDiscounts.find(d => {
                if (d.type !== 'buy_get') return false;
                
                console.log('🔍 فحص خصم:', {
                    type: d.type,
                    medicine: d.medicine,
                    medicineName: medicine.name,
                    medicineId: d.medicineId,
                    medicineId2: medicine.id,
                    freeQuantity: d.freeQuantity,
                    discount: d.discount
                });
                
                // البحث بالاسم
                const nameMatch = d.medicine && d.medicine === medicine.name;
                
                // البحث بالمعرف
                const idMatch = d.medicineId && (
                    d.medicineId === medicine.id || 
                    String(d.medicineId) === String(medicine.id) ||
                    d.medicineId?.toString() === medicine.id?.toString()
                );
                
                // البحث في discount.medicine_id (إذا كان موجوداً في discount نفسه)
                const discountMedicineIdMatch = d.discount && d.discount.medicine_id && (
                    d.discount.medicine_id === medicine.id ||
                    String(d.discount.medicine_id) === String(medicine.id) ||
                    d.discount.medicine_id?.toString() === medicine.id?.toString()
                );
                
                // إذا كان هناك تطابق في discount.medicine_id ولكن freeQuantity غير موجود، نحسبه
                if (discountMedicineIdMatch && !d.freeQuantity && d.discount && d.discount.buy_quantity && d.discount.get_quantity) {
                    const calculatedFreeQuantity = Math.floor(medicine.quantity / d.discount.buy_quantity) * d.discount.get_quantity;
                    if (calculatedFreeQuantity > 0) {
                        console.log('✅ حساب freeQuantity من discount مباشرة:', calculatedFreeQuantity);
                        // إضافة freeQuantity إلى الخصم
                        d.freeQuantity = calculatedFreeQuantity;
                    }
                }
                
                const match = nameMatch || idMatch || discountMedicineIdMatch;
                console.log('🔍 نتيجة المطابقة:', { 
                    nameMatch, 
                    idMatch, 
                    discountMedicineIdMatch,
                    match,
                    discountMedicineId: d.discount?.medicine_id,
                    medicineId: medicine.id
                });
                
                return match;
            });
            
            if (buyGetDiscount) {
                console.log('✅ وجدت buyGetDiscount:', buyGetDiscount);
                if (buyGetDiscount.freeQuantity) {
                    freeQuantity = buyGetDiscount.freeQuantity;
                    console.log('✅ وجدت freeQuantity في appliedDiscounts:', freeQuantity);
                }
            } else {
                console.log('❌ لم أجد buyGetDiscount للدواء:', medicine.name);
            }
        }
        
        
        const totalQuantity = originalQuantity + freeQuantity; // الكمية الإجمالية (المطلوبة + المجانية)
        
        console.log('📊 النتيجة النهائية:', {
            medicineName: medicine.name,
            medicineId: medicine.id,
            originalQuantity,
            freeQuantity,
            totalQuantity,
            medicineForDiscount: medicineForDiscount ? {
                hasFreeQuantity: medicineForDiscount.freeQuantity !== undefined,
                freeQuantity: medicineForDiscount.freeQuantity,
                originalQuantity: medicineForDiscount.originalQuantity
            } : null
        });
        
        medicinesList += `
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex-1">
                    <p class="font-medium text-gray-900">${medicine.name}</p>
                    <p class="text-sm text-gray-600">
                        ${originalQuantity} قطعة × ${medicine.price} جنيه
                        ${freeQuantity > 0 ? `<span class="text-green-600 font-semibold"> + ${freeQuantity} قطعة مجانية</span>` : ''}
                    </p>
                    ${freeQuantity > 0 ? `<p class="text-xs text-green-600 mt-1">🎁 خصم: شراء ${originalQuantity} واحصل على ${freeQuantity} مجاناً (إجمالي: ${totalQuantity} قطعة)</p>` : ''}
                    ${hasDiscount && discountAmount > 0 ? `<p class="text-xs text-gray-500 line-through">${originalPrice.toFixed(2)} جنيه</p>` : ''}
                </div>
                <div class="text-right">
                    <p class="font-medium ${hasDiscount ? 'text-green-600' : 'text-gray-900'}">${displayPrice.toFixed(2)} جنيه</p>
                    ${hasDiscount && discountAmount > 0 ? `<p class="text-xs text-green-600">خصم: -${discountAmount.toFixed(2)} جنيه</p>` : ''}
                </div>
            </div>
        `;
    });
    
    // عرض الخصومات المطبقة
    let discountsDisplay = '';
    if (discountResult && discountResult.appliedDiscounts && discountResult.appliedDiscounts.length > 0) {
        discountsDisplay = `
            <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 class="font-medium text-green-900 mb-2 flex items-center">
                    <i class="fas fa-tag ml-2"></i> الخصومات المطبقة:
                </h4>
                <div class="space-y-2">
        `;
        
        discountResult.appliedDiscounts.forEach(appliedDiscount => {
            if (appliedDiscount.type === 'medicine') {
                discountsDisplay += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-700">خصم على ${appliedDiscount.medicine}: ${appliedDiscount.discount.percentage}%</span>
                        <span class="text-green-600 font-semibold">-${appliedDiscount.amount.toFixed(2)} جنيه</span>
                    </div>
                `;
            } else if (appliedDiscount.type === 'order') {
                discountsDisplay += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-700">${appliedDiscount.discount.name || 'خصم على الطلب'}: ${appliedDiscount.discount.percentage}%</span>
                        <span class="text-green-600 font-semibold">-${appliedDiscount.amount.toFixed(2)} جنيه</span>
                    </div>
                `;
            } else if (appliedDiscount.type === 'buy_get') {
                discountsDisplay += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-700">${appliedDiscount.description || `شراء ${appliedDiscount.discount.buy_quantity} واحصل على ${appliedDiscount.discount.get_quantity} مجاناً`}</span>
                        <span class="text-green-600 font-semibold">مجاني</span>
                    </div>
                `;
            }
        });
        
        discountsDisplay += `
                </div>
            </div>
        `;
    }
    
    formContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl modal-content">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">ملخص الطلب</h3>
                    <button onclick="closeOrderSummaryModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">معلومات الشركة</h4>
                    <p class="text-sm text-gray-600">${company.users ? company.users.name : company.name}</p>
                    ${company.users && company.users.email ? `<p class="text-sm text-gray-600">${company.users.email}</p>` : ''}
                    ${company.phone ? `<p class="text-sm text-gray-600">${company.phone}</p>` : ''}
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">الأدوية المطلوبة:</h4>
                    <div class="space-y-2">
                        ${medicinesList}
                    </div>
                </div>
                
                ${discountsDisplay}
                
                ${company.type === 'company' ? `
                <!-- عرض الرصيد المتاح -->
                <div class="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">الرصيد المتاح لدى ${company.name}</p>
                            <p class="text-xl font-bold text-green-600" id="availableCredit-${company.id}">جاري التحميل...</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-wallet text-green-600 text-xl"></i>
                        </div>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" 
                               id="useCreditCheckbox-${company.id}" 
                               class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                               onchange="updateCreditUsage('${company.id}', ${finalAmount})">
                        <span class="text-sm font-medium text-gray-700">استخدام الرصيد المتاح</span>
                    </label>
                    <input type="number" 
                           id="creditAmountInput-${company.id}" 
                           min="0" 
                           step="0.01"
                           value="0"
                           class="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent hidden"
                           oninput="updateFinalAmountAfterCredit('${company.id}', ${finalAmount})"
                           placeholder="المبلغ المراد استخدامه من الرصيد">
                    <p class="text-xs text-gray-500 mt-2" id="creditUsageInfo-${company.id}"></p>
                </div>
                ` : ''}
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                    <select id="orderPaymentMethod" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">اختر طريقة الدفع</option>
                        <option value="كاش (نقداً)">كاش (نقداً)</option>
                        <option value="آجل">آجل</option>
                    </select>
                </div>
                
                <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                        ${totalDiscount > 0 ? `
                            <p class="text-sm text-gray-600 line-through">المجموع قبل الخصم: ${totalAmount.toFixed(2)} جنيه</p>
                            <p class="text-sm text-green-600">الخصم: -${totalDiscount.toFixed(2)} جنيه</p>
                        ` : ''}
                        <p id="finalAmountDisplay-${company.id}" class="text-lg font-bold text-gray-900">المجموع الإجمالي: <span class="text-blue-600">${finalAmount.toFixed(2)}</span> جنيه</p>
                        <p id="creditDeductionDisplay-${company.id}" class="text-sm text-green-600 mt-1 hidden"></p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeOrderSummaryModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            إلغاء
                        </button>
                        <button onclick="confirmOrder('${company.id}')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            تأكيد الطلب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الصفحة
    document.body.appendChild(formContainer);
    
    // جلب الرصيد المتاح إذا كانت الشركة
    if (company.type === 'company' && typeof getUserCompanyCredit === 'function') {
        const user = getCurrentUser();
        if (user) {
            getUserCompanyCredit(user.id, company.id)
                .then(credit => {
                    const creditEl = document.getElementById(`availableCredit-${company.id}`);
                    if (creditEl) {
                        creditEl.textContent = formatCurrency(credit);
                        // تفعيل/تعطيل checkbox حسب الرصيد
                        const checkbox = document.getElementById(`useCreditCheckbox-${company.id}`);
                        if (checkbox) {
                            if (credit > 0) {
                                checkbox.disabled = false;
                                checkbox.parentElement.querySelector('span').textContent = 'استخدام الرصيد المتاح';
                            } else {
                                checkbox.disabled = true;
                                checkbox.parentElement.querySelector('span').textContent = 'لا يوجد رصيد متاح';
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('❌ خطأ في جلب الرصيد:', error);
                    const creditEl = document.getElementById(`availableCredit-${company.id}`);
                    if (creditEl) {
                        creditEl.textContent = '0.00 جنيه';
                    }
                });
        }
    }
}

/**
 * تحديث استخدام الرصيد
 */
function updateCreditUsage(companyId, finalAmount) {
    const checkbox = document.getElementById(`useCreditCheckbox-${companyId}`);
    const creditInput = document.getElementById(`creditAmountInput-${companyId}`);
    const creditInfo = document.getElementById(`creditUsageInfo-${companyId}`);
    const creditEl = document.getElementById(`availableCredit-${companyId}`);
    
    if (!checkbox || !creditInput || !creditInfo) return;
    
    const availableCredit = parseFloat(creditEl?.textContent.replace(/[^\d.]/g, '') || 0);
    
    if (checkbox.checked) {
        creditInput.classList.remove('hidden');
        creditInput.max = Math.min(availableCredit, finalAmount);
        creditInput.value = Math.min(availableCredit, finalAmount).toFixed(2);
        updateFinalAmountAfterCredit(companyId, finalAmount);
    } else {
        creditInput.classList.add('hidden');
        creditInput.value = '0';
        updateFinalAmountAfterCredit(companyId, finalAmount);
    }
}

/**
 * تحديث المبلغ الإجمالي بعد خصم الرصيد
 */
function updateFinalAmountAfterCredit(companyId, originalFinalAmount) {
    const creditInput = document.getElementById(`creditAmountInput-${companyId}`);
    const finalAmountDisplay = document.getElementById(`finalAmountDisplay-${companyId}`);
    const creditDeductionDisplay = document.getElementById(`creditDeductionDisplay-${companyId}`);
    
    if (!creditInput || !finalAmountDisplay) return;
    
    const creditAmount = parseFloat(creditInput.value) || 0;
    const creditEl = document.getElementById(`availableCredit-${companyId}`);
    const availableCredit = parseFloat(creditEl?.textContent.replace(/[^\d.]/g, '') || 0);
    
    // التحقق من أن المبلغ لا يتجاوز الرصيد المتاح أو المبلغ الإجمالي
    const validCreditAmount = Math.min(creditAmount, availableCredit, originalFinalAmount);
    if (creditAmount !== validCreditAmount) {
        creditInput.value = validCreditAmount.toFixed(2);
    }
    
    const newFinalAmount = Math.max(0, originalFinalAmount - validCreditAmount);
    
    // تحديث العرض
    finalAmountDisplay.innerHTML = `المجموع الإجمالي: <span class="text-blue-600">${newFinalAmount.toFixed(2)}</span> جنيه`;
    
    if (validCreditAmount > 0) {
        creditDeductionDisplay.classList.remove('hidden');
        creditDeductionDisplay.textContent = `خصم من الرصيد: -${formatCurrency(validCreditAmount)} | المتبقي: ${formatCurrency(newFinalAmount)}`;
    } else {
        creditDeductionDisplay.classList.add('hidden');
    }
}

/**
 * إغلاق نافذة ملخص الطلب
 */
function closeOrderSummaryModal() {
    const formContainer = document.getElementById('orderSummaryContainer');
    if (formContainer) {
        formContainer.remove();
    }
}

/**
 * تأكيد الطلب وإرساله
 * @param {string} companyId - معرف الشركة
 */
async function confirmOrder(companyId) {
    // البحث عن الشركة أو المخزن
    const company = allSystemCompanies.find(c => c.id === companyId);
    if (!company) {
        alert('لم يتم العثور على الشركة أو المخزن');
        return;
    }
    
    // جمع بيانات الأدوية المحددة
    const selectedMedicines = [];
    const checkboxes = document.querySelectorAll('#companyMedicinesTable .medicine-checkbox:checked');
    
    checkboxes.forEach(checkbox => {
        const medicineId = checkbox.dataset.medicineId;
        const medicineName = checkbox.dataset.medicineName;
        const medicinePrice = parseFloat(checkbox.dataset.medicinePrice);
        const maxQuantity = parseInt(checkbox.dataset.medicineMaxQuantity);
        
        const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
        const quantity = parseInt(quantityInput.value) || 1;
        
        selectedMedicines.push({
            medicine_id: medicineId,
            medicine_name: medicineName,
            quantity: quantity,
            unit_price: medicinePrice,
            total_price: medicinePrice * quantity
        });
    });
    
    // الحصول على طريقة الدفع
    const paymentMethodSelect = document.getElementById('orderPaymentMethod');
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
    
    // التحقق من اختيار طريقة الدفع
    if (!paymentMethod) {
        alert('يرجى اختيار طريقة الدفع.');
        return;
    }
    
    // الحصول على بيانات الخصومات من النموذج
    const orderSummaryContainer = document.getElementById('orderSummaryContainer');
    let discountResult = null;
    if (orderSummaryContainer && orderSummaryContainer.dataset.discountResult) {
        try {
            discountResult = JSON.parse(orderSummaryContainer.dataset.discountResult);
        } catch (e) {
            console.error('خطأ في قراءة بيانات الخصومات:', e);
        }
    }
    
    // تحديث أسعار الأدوية بعد الخصومات وإضافة الكمية المجانية
    let finalOrderItems = selectedMedicines;
    let finalAmount = selectedMedicines.reduce((sum, item) => sum + item.total_price, 0);
    
    if (discountResult && discountResult.medicinesWithDiscounts) {
        finalOrderItems = selectedMedicines.map(item => {
            const discountedMedicine = discountResult.medicinesWithDiscounts.find(m => m.id === item.medicine_id);
            if (discountedMedicine) {
                const updatedItem = { ...item };
                
                // تطبيق خصم النسبة المئوية على السعر
                if (discountedMedicine.discountedTotal !== undefined) {
                    updatedItem.total_price = discountedMedicine.discountedTotal; // السعر بعد الخصم
                    updatedItem.original_price = item.total_price;
                    updatedItem.discount_amount = discountedMedicine.discountAmount || 0;
                }
                
                // إضافة الكمية المجانية (buy_get)
                if (discountedMedicine.freeQuantity && discountedMedicine.freeQuantity > 0) {
                    updatedItem.quantity = discountedMedicine.totalQuantity || item.quantity; // إضافة الكمية المجانية
                    updatedItem.free_quantity = discountedMedicine.freeQuantity; // الكمية المجانية
                    updatedItem.original_quantity = item.quantity; // الكمية الأصلية المدفوعة
                    // ملاحظة: الكمية المجانية لا تؤثر على السعر، فقط على الكمية الإجمالية
                }
                
                return updatedItem;
            }
            return item;
        });
        finalAmount = discountResult.finalAmount;
    }
    
    // إنشاء بيانات الطلب
    const orderData = {
        companyId: companyId,
        paymentMethod: paymentMethod,
        totalDiscount: discountResult ? discountResult.totalDiscount : 0,
        originalAmount: discountResult ? discountResult.originalAmount : finalAmount,
        finalAmount: finalAmount,
        supplierType: company.type || 'company' // نوع المورد: 'company' أو 'warehouse'
    };
    
    // إظهار مؤشر التحميل
    const confirmButton = document.querySelector('button[onclick*="confirmOrder"]');
    const originalText = confirmButton.innerHTML;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>جاري الإنشاء...';
    confirmButton.disabled = true;
    
    try {
        // التحقق من صحة معرف الشركة
        if (!companyId) {
            alert('معرف الشركة غير صحيح. يرجى المحاولة مرة أخرى.');
            confirmButton.innerHTML = originalText;
            confirmButton.disabled = false;
            return;
        }

        // جلب مبلغ الرصيد المستخدم إن وجد
        let creditAmount = 0;
        if (company.type === 'company') {
            const useCreditCheckbox = document.getElementById(`useCreditCheckbox-${companyId}`);
            const creditInput = document.getElementById(`creditAmountInput-${companyId}`);
            
            if (useCreditCheckbox && useCreditCheckbox.checked && creditInput) {
                creditAmount = parseFloat(creditInput.value) || 0;
                
                // التحقق من الرصيد المتاح
                const user = getCurrentUser();
                if (user && typeof getUserCompanyCredit === 'function') {
                    const availableCredit = await getUserCompanyCredit(user.id, companyId);
                    if (creditAmount > availableCredit) {
                        alert(`المبلغ المحدد (${formatCurrency(creditAmount)}) أكبر من الرصيد المتاح (${formatCurrency(availableCredit)})`);
                        confirmButton.innerHTML = originalText;
                        confirmButton.disabled = false;
                        return;
                    }
                }
            }
        }
        
        // تحديث المبلغ النهائي بعد خصم الرصيد
        const finalAmountAfterCredit = Math.max(0, finalAmount - creditAmount);

        console.log('🔄 جاري تأكيد الطلب وإرساله للشركة:', companyId);
        console.log('📋 بيانات الأدوية المحددة:', finalOrderItems);
        console.log('💰 طريقة الدفع:', paymentMethod);
        console.log('🎁 الخصومات المطبقة:', discountResult);
        console.log('💳 مبلغ الرصيد المستخدم:', creditAmount);
        console.log('💰 المبلغ النهائي بعد خصم الرصيد:', finalAmountAfterCredit);

        // تحديث orderData بإضافة معلومات الرصيد
        const orderDataWithCredit = {
            ...orderData,
            finalAmount: finalAmountAfterCredit,
            creditDeductionFromBalance: creditAmount // مبلغ خصم الرصيد
        };

        // محاولة إضافة الطلب إلى Supabase
        if (typeof addOrderToSupabase === 'function') {
            const result = await addOrderToSupabase(orderDataWithCredit, finalOrderItems);
            if (result) {
                console.log('✅ تم إرسال الطلب بنجاح للشركة:', companyId);
                
                // إغلاق النافذة
                closeOrderSummaryModal();
                
                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    let message = `تم إرسال الطلب بنجاح للشركة. رقم الطلب: ${result.order_number}`;
                    if (discountResult && discountResult.totalDiscount > 0) {
                        message += ` - تم تطبيق خصم بقيمة ${discountResult.totalDiscount.toFixed(2)} جنيه`;
                    }
                    if (creditAmount > 0) {
                        message += ` - تم خصم ${formatCurrency(creditAmount)} من الرصيد`;
                    }
                    showNotification(message, 'success');
                }
                
                // إعادة تحميل قائمة الشركات والأدوية لإعادة تحميل الطلبات
                if (typeof loadCompaniesAndMedicines === 'function') {
                    await loadCompaniesAndMedicines();
                }
                
                // إعادة تحميل الطلبات إذا كنا في صفحة الطلبات
                if (typeof loadOrders === 'function') {
                    await loadOrders();
                }
                
                // إعادة تحميل الطلبات الواردة
                if (typeof loadIncomingOrders === 'function') {
                    await loadIncomingOrders();
                }
                
                return;
            }
        }
        
        // إذا فشلت إضافة الطلب إلى Supabase
        alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        const errorMessage = error.message || 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.';
        alert(errorMessage);
        
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
    } finally {
        // إخفاء مؤشر التحميل
        confirmButton.innerHTML = originalText;
        confirmButton.disabled = false;
    }
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCompanies,
        loadMedicines,
        loadOrders,
        loadIncomingOrders,
        loadCompaniesAndMedicines,
        loadAllSystemCompanies, // Export the new function
        incomingOrders,
        allSystemCompanies, // Export the new variable
        createOrderFromCompany, // Export the new function
        closeOrderForm, // Export the new function
        submitOrder, // Export the new function
        showCompanyDetails, // Export the new function
        renderCompanyMedicines, // Export the new function
        openCreateOrderModal, // Export the new function
        currentCompanyDetails, // Export the new variable
        toggleAllMedicines, // Export the new function
        updateSelectAllState, // Export the new function
        createOrderFromSelectedMedicines, // Export the new function
        createOrderFromSelectedMedicinesList, // Export the new function
        showOrderSummaryModal, // Export the new function
        closeOrderSummaryModal, // Export the new function
        confirmOrder // Export the new function
    };
}

// Make functions globally accessible
/**
 * تعديل الطلب
 * @param {string} orderId - معرف الطلب
 */
async function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId) || incomingOrders.find(o => o.id === orderId);
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    // التحقق من أن الطلب لم يتم شحنه
    if (order.status === 'shipped' || order.status === 'delivered') {
        alert('لا يمكن تعديل الطلب بعد شحنه');
        return;
    }
    
    // البحث عن الشركة
    const company = allSystemCompanies.find(c => c.id === order.companyId);
    if (!company) {
        alert('لم يتم العثور على الشركة');
        return;
    }
    
    // جلب بيانات الطلب الكاملة من Supabase
    if (typeof getOrdersFromSupabase === 'function') {
        const allOrders = await getOrdersFromSupabase();
        const fullOrder = allOrders.find(o => o.id === orderId);
        if (fullOrder) {
            showEditOrderModal(fullOrder, company);
        } else {
            alert('لا يمكن تحميل بيانات الطلب');
        }
    }
}

/**
 * عرض نموذج تعديل الطلب
 * @param {Object} order - بيانات الطلب الكاملة
 * @param {Object} company - بيانات الشركة
 */
function showEditOrderModal(order, company) {
    // إغلاق نافذة التفاصيل إذا كانت مفتوحة
    closeOrderDetailsModal();
    
    // استخراج الأدوية الموجودة في الطلب
    const currentOrderItems = order.order_items || [];
    const currentMedicines = currentOrderItems.map(item => {
        // استخراج الكمية المجانية والكمية الأصلية
        let freeQuantity = 0;
        let originalQuantity = item.quantity;
        
        if (item.batch_number && item.batch_number.includes('free_quantity:')) {
            try {
                const parts = item.batch_number.split(':');
                const freeIndex = parts.indexOf('free_quantity');
                const originalIndex = parts.indexOf('original_quantity');
                
                if (freeIndex !== -1 && parts[freeIndex + 1]) {
                    freeQuantity = parseInt(parts[freeIndex + 1]) || 0;
                }
                if (originalIndex !== -1 && parts[originalIndex + 1]) {
                    originalQuantity = parseInt(parts[originalIndex + 1]) || item.quantity;
                }
            } catch (e) {
                console.error('خطأ في قراءة الكمية المجانية:', e);
            }
        }
        
        return {
            id: item.id, // معرف order_item
            medicine_name: item.medicine_name,
            quantity: item.quantity,
            original_quantity: originalQuantity,
            free_quantity: freeQuantity,
            unit_price: item.price,
            total_price: item.total_price
        };
    });
    
    // إنشاء نموذج التعديل
    const formContainer = document.createElement('div');
    formContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    formContainer.id = 'editOrderContainer';
    
    // عرض الأدوية الموجودة في الطلب
    let currentMedicinesList = '';
    currentMedicines.forEach((item, index) => {
        currentMedicinesList += `
            <div class="border border-gray-200 rounded-lg p-4 mb-3 current-order-item" data-item-index="${index}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${item.medicine_name}</h4>
                        <p class="text-sm text-gray-600">السعر: ${formatCurrency(item.unit_price)}</p>
                    </div>
                    <button onclick="removeOrderItem(${index})" class="text-red-600 hover:text-red-800 p-2" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="flex items-center gap-4">
                    <label class="text-sm font-medium text-gray-700">الكمية:</label>
                    <input type="number" 
                           min="1" 
                           value="${item.original_quantity}"
                           class="w-24 border border-gray-300 rounded px-3 py-1 text-center order-item-quantity"
                           data-item-index="${index}"
                           data-price="${item.unit_price}">
                    <span class="text-sm text-gray-600">× ${formatCurrency(item.unit_price)} = <span class="font-semibold order-item-total" data-item-index="${index}">${formatCurrency(item.total_price)}</span></span>
                </div>
            </div>
        `;
    });
    
    
    formContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">تعديل الطلب ${order.order_number}</h3>
                    <button onclick="closeEditOrderModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">معلومات الشركة</h4>
                    <p class="text-sm text-gray-600">${company.users ? company.users.name : company.name}</p>
                    ${company.phone ? `<p class="text-sm text-gray-600">${company.phone}</p>` : ''}
                </div>
                
                <!-- الأدوية الموجودة في الطلب -->
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">الأدوية الموجودة في الطلب</h4>
                    <div id="currentOrderItemsList">
                        ${currentMedicinesList || '<p class="text-gray-500 text-sm">لا توجد أدوية في الطلب</p>'}
                    </div>
                </div>
                
                <!-- زر إضافة دواء جديد -->
                <div class="mb-6">
                    <button onclick="openAddMedicineToOrderModal('${company.id}')" 
                            class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                        <i class="fas fa-plus"></i>
                        إضافة دواء جديد
                    </button>
                </div>
                
                <!-- إجمالي الطلب -->
                <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-900">المجموع الإجمالي:</span>
                        <span class="text-xl font-bold text-blue-600" id="editOrderTotal">${formatCurrency(order.final_amount || order.total_amount)}</span>
                    </div>
                </div>
                
                <!-- أزرار الإجراءات -->
                <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button onclick="closeEditOrderModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        إلغاء
                    </button>
                    <button onclick="saveEditedOrder('${order.id}')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        <i class="fas fa-save ml-2"></i> حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(formContainer);
    
    // إضافة مستمعي الأحداث لتحديث المجموع عند تغيير الكميات
    formContainer.querySelectorAll('.order-item-quantity').forEach(input => {
        input.addEventListener('input', function() {
            updateEditOrderItemTotal(this);
            updateEditOrderTotal();
        });
    });
    
    // حفظ بيانات الطلب الأصلية في dataset
    formContainer.dataset.orderId = order.id;
    formContainer.dataset.companyId = company.id;
    formContainer.dataset.paymentMethod = order.payment_method || '';
    formContainer.dataset.supplierType = company.type || order.supplier_type || 'company';
}

/**
 * تحديث إجمالي عنصر في الطلب
 */
function updateEditOrderItemTotal(input) {
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    const index = input.dataset.itemIndex;
    const quantity = parseInt(input.value) || 0;
    const price = parseFloat(input.dataset.price) || 0;
    const total = quantity * price;
    
    const totalElement = formContainer.querySelector(`.order-item-total[data-item-index="${index}"]`);
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

/**
 * تحديث المجموع الإجمالي للطلب
 */
function updateEditOrderTotal() {
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    let total = 0;
    
    // جمع إجمالي الأدوية الموجودة
    formContainer.querySelectorAll('.current-order-item').forEach(item => {
        const quantityInput = item.querySelector('.order-item-quantity');
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value) || 0;
            const price = parseFloat(quantityInput.dataset.price) || 0;
            total += quantity * price;
        }
    });
    
    // عرض المجموع
    const totalElement = document.getElementById('editOrderTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

/**
 * فتح نافذة إضافة دواء جديد للطلب
 */
function openAddMedicineToOrderModal(companyId) {
    const company = allSystemCompanies.find(c => c.id === companyId);
    if (!company) {
        alert('لم يتم العثور على الشركة');
        return;
    }
    
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    // الحصول على الأدوية الموجودة في الطلب
    const currentItemsList = formContainer.querySelector('#currentOrderItemsList');
    const currentMedicines = Array.from(currentItemsList.querySelectorAll('.current-order-item')).map(item => 
        item.querySelector('h4').textContent.toLowerCase()
    );
    
    // تصفية الأدوية المتاحة (استبعاد الأدوية الموجودة)
    const availableMedicines = (company.medicines || []).filter(m => 
        !currentMedicines.includes(m.name.toLowerCase())
    );
    
    if (availableMedicines.length === 0) {
        alert('لا توجد أدوية متاحة للإضافة');
        return;
    }
    
    // إنشاء نافذة البحث
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'addMedicineToOrderModal';
    
    // إنشاء قائمة الأدوية مع البحث
    let medicinesList = '';
    availableMedicines.forEach(medicine => {
        medicinesList += `
            <div class="border border-gray-200 rounded-lg p-4 mb-3 medicine-item" 
                 data-medicine-name="${medicine.name.toLowerCase()}"
                 data-medicine-id="${medicine.id}">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${medicine.name}</h4>
                        <p class="text-sm text-gray-600">${medicine.category || 'غير مصنف'}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">${formatCurrency(medicine.price)}</p>
                        <p class="text-sm text-gray-600">متوفر: ${medicine.quantity} قطعة</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <label class="text-sm font-medium text-gray-700">الكمية:</label>
                    <input type="number" 
                           min="1" 
                           max="${medicine.quantity}"
                           value="1"
                           class="w-24 border border-gray-300 rounded px-3 py-1 text-center new-medicine-quantity"
                           data-medicine-id="${medicine.id}"
                           data-price="${medicine.price}"
                           data-name="${medicine.name}"
                           data-max="${medicine.quantity}">
                    <button onclick="addMedicineToOrderFromModal('${medicine.id}', '${medicine.name.replace(/'/g, "\\'")}', ${medicine.price}, ${medicine.quantity})" 
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                        <i class="fas fa-plus ml-1"></i> إضافة
                    </button>
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">إضافة دواء جديد</h3>
                    <button onclick="closeAddMedicineToOrderModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- البحث -->
                <div class="mb-4">
                    <input type="text" 
                           id="searchMedicineInput" 
                           placeholder="ابحث عن دواء بالاسم..."
                           class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           onkeyup="filterMedicinesInOrderModal()">
                </div>
                
                <!-- قائمة الأدوية -->
                <div id="availableMedicinesList" class="max-h-[60vh] overflow-y-auto">
                    ${medicinesList}
                </div>
                
                <div class="mt-4 flex justify-end">
                    <button onclick="closeAddMedicineToOrderModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * تصفية الأدوية في نافذة إضافة الدواء
 */
function filterMedicinesInOrderModal() {
    const searchInput = document.getElementById('searchMedicineInput');
    const filter = searchInput.value.toLowerCase();
    const medicinesList = document.getElementById('availableMedicinesList');
    const items = medicinesList.querySelectorAll('.medicine-item');
    
    items.forEach(item => {
        const medicineName = item.dataset.medicineName;
        if (medicineName.includes(filter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * إضافة دواء جديد للطلب من النافذة
 */
function addMedicineToOrderFromModal(medicineId, medicineName, price, maxQuantity) {
    const modal = document.getElementById('addMedicineToOrderModal');
    if (!modal) return;
    
    const medicineElement = modal.querySelector(`.medicine-item[data-medicine-id="${medicineId}"]`);
    if (!medicineElement) return;
    
    const quantityInput = medicineElement.querySelector('.new-medicine-quantity');
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (quantity < 1 || quantity > maxQuantity) {
        alert(`الكمية يجب أن تكون بين 1 و ${maxQuantity}`);
        return;
    }
    
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    // إضافة الدواء إلى قائمة الأدوية الموجودة
    const currentItemsList = formContainer.querySelector('#currentOrderItemsList');
    const itemIndex = currentItemsList.querySelectorAll('.current-order-item').length;
    
    const newItem = document.createElement('div');
    newItem.className = 'border border-gray-200 rounded-lg p-4 mb-3 current-order-item';
    newItem.dataset.itemIndex = itemIndex;
    newItem.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
                <h4 class="font-medium text-gray-900">${medicineName}</h4>
                <p class="text-sm text-gray-600">السعر: ${formatCurrency(price)}</p>
            </div>
            <button onclick="removeOrderItem(${itemIndex})" class="text-red-600 hover:text-red-800 p-2" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">الكمية:</label>
            <input type="number" 
                   min="1" 
                   max="${maxQuantity}"
                   value="${quantity}"
                   class="w-24 border border-gray-300 rounded px-3 py-1 text-center order-item-quantity"
                   data-item-index="${itemIndex}"
                   data-price="${price}">
            <span class="text-sm text-gray-600">× ${formatCurrency(price)} = <span class="font-semibold order-item-total" data-item-index="${itemIndex}">${formatCurrency(quantity * price)}</span></span>
        </div>
    `;
    
    currentItemsList.appendChild(newItem);
    
    // إضافة مستمع حدث للكمية
    const quantityInputNew = newItem.querySelector('.order-item-quantity');
    quantityInputNew.addEventListener('input', function() {
        updateEditOrderItemTotal(this);
        updateEditOrderTotal();
    });
    
    // تحديث المجموع
    updateEditOrderTotal();
    
    // إغلاق النافذة
    closeAddMedicineToOrderModal();
    
    // إظهار رسالة نجاح
    if (typeof showNotification === 'function') {
        showNotification(`تم إضافة ${medicineName} بنجاح`, 'success');
    }
}

/**
 * إغلاق نافذة إضافة دواء جديد
 */
function closeAddMedicineToOrderModal() {
    const modal = document.getElementById('addMedicineToOrderModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * حذف عنصر من الطلب
 */
function removeOrderItem(itemIndex) {
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    const item = formContainer.querySelector(`.current-order-item[data-item-index="${itemIndex}"]`);
    if (item) {
        item.remove();
        updateEditOrderTotal();
    }
}

/**
 * حفظ التعديلات على الطلب
 */
async function saveEditedOrder(orderId) {
    const formContainer = document.getElementById('editOrderContainer');
    if (!formContainer) return;
    
    // جمع الأدوية المحددة
    const orderItems = [];
    const currentItems = formContainer.querySelectorAll('.current-order-item');
    
    if (currentItems.length === 0) {
        alert('يرجى إضافة دواء واحد على الأقل');
        return;
    }
    
    currentItems.forEach(item => {
        const medicineName = item.querySelector('h4').textContent;
        const quantityInput = item.querySelector('.order-item-quantity');
        const quantity = parseInt(quantityInput.value) || 1;
        const price = parseFloat(quantityInput.dataset.price) || 0;
        const totalPrice = quantity * price;
        
        orderItems.push({
            medicine_name: medicineName,
            quantity: quantity,
            original_quantity: quantity,
            unit_price: price,
            total_price: totalPrice
        });
    });
    
    // حساب المبلغ الإجمالي
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // تطبيق الخصومات إذا كانت متاحة
    const companyId = formContainer.dataset.companyId;
    const company = allSystemCompanies.find(c => c.id === companyId);
    const discounts = company?.discounts || [];
    let discountResult = null;
    
    if (discounts && discounts.length > 0 && typeof applyDiscounts === 'function') {
        const medicinesForDiscount = orderItems.map(m => ({
            id: m.medicine_name, // استخدام الاسم كمعرف مؤقت
            name: m.medicine_name,
            quantity: m.quantity,
            price: m.unit_price,
            total: m.total_price
        }));
        
        discountResult = applyDiscounts(medicinesForDiscount, discounts, totalAmount);
    }
    
    const finalAmount = discountResult ? discountResult.finalAmount : totalAmount;
    const totalDiscount = discountResult ? discountResult.totalDiscount : 0;
    
    // تحديث orderItems مع الخصومات
    const finalOrderItems = orderItems.map(item => {
        const medicineForDiscount = discountResult?.medicinesWithDiscounts?.find(m => m.name === item.medicine_name);
        
        if (medicineForDiscount) {
            if (medicineForDiscount.freeQuantity) {
                item.quantity = medicineForDiscount.totalQuantity || item.quantity;
                item.free_quantity = medicineForDiscount.freeQuantity;
            }
            if (medicineForDiscount.discountedTotal !== undefined) {
                item.total_price = medicineForDiscount.discountedTotal;
                item.discount_amount = medicineForDiscount.discountAmount || 0;
            }
        }
        
        return item;
    });
    
    // جلب بيانات الطلب الأصلية من dataset
    const paymentMethod = formContainer.dataset.paymentMethod || null;
    const supplierType = formContainer.dataset.supplierType || 'company';
    
    // بيانات الطلب المحدثة
    const orderData = {
        originalAmount: totalAmount,
        totalDiscount: totalDiscount,
        finalAmount: finalAmount,
        paymentMethod: paymentMethod,
        supplierType: supplierType,
        companyId: formContainer.dataset.companyId || null
    };
    
    try {
        // حفظ التعديلات في Supabase
        if (typeof updateOrderInSupabase === 'function') {
            const result = await updateOrderInSupabase(orderId, orderData, finalOrderItems);
            if (result) {
                alert('✅ تم تحديث الطلب بنجاح');
                closeEditOrderModal();
                
                // إعادة تحميل الطلبات
                if (typeof loadOrders === 'function') {
                    await loadOrders();
                }
            } else {
                alert('❌ حدث خطأ أثناء تحديث الطلب');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث الطلب:', error);
        alert('❌ حدث خطأ أثناء تحديث الطلب: ' + error.message);
    }
}

/**
 * إغلاق نموذج تعديل الطلب
 */
function closeEditOrderModal() {
    const formContainer = document.getElementById('editOrderContainer');
    if (formContainer) {
        formContainer.remove();
    }
}

window.showCompanyDetails = showCompanyDetails;
window.toggleAllMedicines = toggleAllMedicines;
window.createOrderFromSelectedMedicines = createOrderFromSelectedMedicines;
window.openCreateOrderModal = openCreateOrderModal;
window.closeOrderForm = closeOrderForm;
window.closeOrderSummaryModal = closeOrderSummaryModal;
window.selectCompany = selectCompany;
window.renderCompaniesList = renderCompaniesList;
window.renderCompanyDetails = renderCompanyDetails;
window.filterMedicinesInCompany = filterMedicinesInCompany;
window.editOrder = editOrder;
window.closeEditOrderModal = closeEditOrderModal;
window.addMedicineToOrderFromModal = addMedicineToOrderFromModal;
window.removeOrderItem = removeOrderItem;
window.saveEditedOrder = saveEditedOrder;
window.openAddMedicineToOrderModal = openAddMedicineToOrderModal;
window.closeAddMedicineToOrderModal = closeAddMedicineToOrderModal;
window.updateCreditUsage = updateCreditUsage;
window.updateFinalAmountAfterCredit = updateFinalAmountAfterCredit;
window.filterMedicinesInOrderModal = filterMedicinesInOrderModal;


/**
 * إنشاء طلب من شركة معينة
 * @param {string} companyId - معرف الشركة
 */
function createOrderFromCompany(companyId) {
    console.log('إنشاء طلب من الشركة:', companyId);
    
    // البحث عن الشركة المحددة
    let company = allSystemCompanies.find(c => c.id === companyId);
    
    // إذا لم نجد الشركة في القائمة الشاملة، نحاول البحث في قائمة الشركات الحالية
    if (!company && typeof currentCompanyDetails !== 'undefined' && currentCompanyDetails && currentCompanyDetails.id === companyId) {
        company = currentCompanyDetails;
    }
    
    if (!company) {
        alert('لم يتم العثور على الشركة المحددة.');
        return;
    }
    
    // الحصول على الأدوية المتاحة من هذه الشركة
    const companyMedicines = company.medicines || [];
    if (companyMedicines.length === 0) {
        alert('لا توجد أدوية متاحة من هذه الشركة.');
        return;
    }
    
    // إنشاء نموذج لاختيار الأدوية والكميات
    createOrderForm(company, companyMedicines);
}

/**
 * فتح نموذج إنشاء الطلب
 */
function openCreateOrderModal() {
    if (!currentCompanyDetails) {
        alert('لا توجد شركة محددة.');
        return;
    }
    
    // الحصول على الأدوية المتاحة من هذه الشركة
    const companyMedicines = currentCompanyDetails.medicines || [];
    if (companyMedicines.length === 0) {
        alert('لا توجد أدوية متاحة من هذه الشركة.');
        return;
    }
    
    // إنشاء نموذج لاختيار الأدوية والكميات
    createOrderForm(currentCompanyDetails, companyMedicines);
}

/**
 * إنشاء نموذج لإنشاء طلب جديد
 * @param {Object} company - بيانات الشركة
 * @param {Array} medicines - أدوية الشركة
 */
function createOrderForm(company, medicines) {
    // إنشاء عنصر نموذج
    const formContainer = document.createElement('div');
    formContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    formContainer.id = 'orderFormContainer';
    
    // إنشاء محتوى النموذج
    let medicinesOptions = '';
    medicines.forEach(medicine => {
        medicinesOptions += `
            <div class="border border-gray-200 rounded-lg p-4 mb-3">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium text-gray-900">${medicine.name}</h4>
                        <p class="text-sm text-gray-600">${medicine.category || 'غير مصنف'}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">${medicine.price} جنيه</p>
                        <p class="text-sm text-gray-600">متوفر: ${medicine.quantity} قطعة</p>
                    </div>
                </div>
                <div class="mt-3 flex items-center">
                    <label class="mr-3 text-sm font-medium text-gray-700">الكمية:</label>
                    <input type="number" 
                           name="quantity_${medicine.id}" 
                           min="1" 
                           max="${medicine.quantity}" 
                           value="1"
                           class="w-20 border border-gray-300 rounded px-3 py-1 text-center"
                           data-price="${medicine.price}"
                           data-name="${medicine.name}"
                           data-id="${medicine.id}">
                </div>
            </div>
        `;
    });
    
    formContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">إنشاء طلب جديد من ${company.users ? company.users.name : company.name}</h3>
                    <button onclick="closeOrderForm()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-2">معلومات الشركة</h4>
                    <p class="text-sm text-gray-600">${company.users ? company.users.name : company.name}</p>
                    ${company.users && company.users.email ? `<p class="text-sm text-gray-600">${company.users.email}</p>` : ''}
                    ${company.phone ? `<p class="text-sm text-gray-600">${company.phone}</p>` : ''}
                </div>
                
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">اختر الأدوية والكميات:</h4>
                    ${medicinesOptions}
                </div>
                
                <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                        <p class="text-lg font-bold text-gray-900">المجموع: <span id="totalAmount">0</span> جنيه</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeOrderForm()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            إلغاء
                        </button>
                        <button onclick="submitOrder('${company.id}')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            إنشاء الطلب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الصفحة
    document.body.appendChild(formContainer);
    
    // إضافة مستمعي الأحداث لتحديث المجموع
    const quantityInputs = formContainer.querySelectorAll('input[type="number"]');
    quantityInputs.forEach(input => {
        input.addEventListener('input', updateOrderTotal);
    });
    
    // تحديث المجموع الأولي
    updateOrderTotal();
}

/**
 * تحديث المجموع الإجمالي للطلب
 */
function updateOrderTotal() {
    const container = document.getElementById('orderFormContainer');
    if (!container) return;
    
    const quantityInputs = container.querySelectorAll('input[type="number"]');
    let total = 0;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        const price = parseFloat(input.dataset.price) || 0;
        total += quantity * price;
    });
    
    const totalElement = container.querySelector('#totalAmount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

/**
 * إغلاق نموذج الطلب
 */
function closeOrderForm() {
    const formContainer = document.getElementById('orderFormContainer');
    if (formContainer) {
        formContainer.remove();
    }
}

/**
 * إرسال الطلب
 * @param {string} companyId - معرف الشركة
 */
async function submitOrder(companyId) {
    const container = document.getElementById('orderFormContainer');
    if (!container) return;
    
    // جمع بيانات الأدوية المحددة
    const quantityInputs = container.querySelectorAll('input[type="number"]');
    const orderItems = [];
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            const medicineId = input.dataset.id;
            const medicineName = input.dataset.name;
            const unitPrice = parseFloat(input.dataset.price);
            const totalPrice = quantity * unitPrice;
            
            orderItems.push({
                medicine_id: medicineId,
                medicine_name: medicineName,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }
    });
    
    // التحقق من وجود أدوية محددة
    if (orderItems.length === 0) {
        alert('يرجى اختيار دواء واحد على الأقل.');
        return;
    }
    
    // إظهار مؤشر التحميل
    const submitButton = container.querySelector('button[onclick*="submitOrder"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>جاري الإنشاء...';
    submitButton.disabled = true;
    
    try {
        // التحقق من صحة معرف الشركة
        if (!companyId) {
            alert('معرف الشركة غير صحيح. يرجى المحاولة مرة أخرى.');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            return;
        }

        console.log('🔄 جاري إرسال الطلب للشركة:', companyId);
        console.log('📋 بيانات الأدوية المحددة:', orderItems);

        // إنشاء بيانات الطلب
        const orderData = {
            companyId: companyId, // companies_users.id
            paymentMethod: null // سيتم تحديده لاحقاً
        };
        
        // محاولة إضافة الطلب إلى Supabase
        if (typeof addOrderToSupabase === 'function') {
            const result = await addOrderToSupabase(orderData, orderItems);
            if (result) {
                console.log('✅ تم إرسال الطلب بنجاح للشركة:', companyId);
                
                // إغلاق النموذج
                closeOrderForm();
                
                // إظهار إشعار النجاح
                if (typeof showNotification === 'function') {
                    showNotification(`تم إرسال الطلب بنجاح للشركة. رقم الطلب: ${result.order_number}`, 'success');
                }
                
                // إعادة تحميل قائمة الشركات والأدوية
                if (typeof loadCompaniesAndMedicines === 'function') {
                    await loadCompaniesAndMedicines();
                }
                
                // إعادة تحميل الطلبات إذا كنا في صفحة الطلبات
                if (typeof loadOrders === 'function') {
                    await loadOrders();
                }
                
                // إعادة تحميل الطلبات الواردة
                if (typeof loadIncomingOrders === 'function') {
                    await loadIncomingOrders();
                }
                
                return;
            }
        }
        
        // إذا فشلت إضافة الطلب إلى Supabase
        alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } catch (error) {
        console.error('❌ خطأ في إنشاء الطلب:', error);
        const errorMessage = error.message || 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.';
        alert(errorMessage);
        
        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
    } finally {
        // إخفاء مؤشر التحميل
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

/**
 * إنشاء طلب من الأدوية المحددة
 */
function createOrderFromSelectedMedicines() {
    if (!currentCompanyDetails) {
        alert('لا توجد شركة محددة.');
        return;
    }
    
    // جمع الأدوية المحددة
    const selectedMedicines = [];
    const checkboxes = document.querySelectorAll('.medicine-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('يرجى تحديد دواء واحد على الأقل.');
        return;
    }
    
    let hasErrors = false;
    
    checkboxes.forEach(checkbox => {
        const medicineId = checkbox.dataset.medicineId;
        const medicineName = checkbox.dataset.medicineName;
        const medicinePrice = parseFloat(checkbox.dataset.medicinePrice);
        const maxQuantity = parseInt(checkbox.dataset.medicineMaxQuantity);
        
        const quantityInput = document.querySelector('.medicine-quantity[data-medicine-id="' + medicineId + '"]');
        const quantity = parseInt(quantityInput.value) || 1;
        
        // التحقق من صحة الكمية
        if (quantity < 1 || quantity > maxQuantity) {
            alert(`الكمية المطلوبة للدواء "${medicineName}" يجب أن تكون بين 1 و ${maxQuantity}`);
            hasErrors = true;
            return;
        }
        
        selectedMedicines.push({
            id: medicineId,
            name: medicineName,
            price: medicinePrice,
            quantity: quantity,
            total: medicinePrice * quantity
        });
    });
    
    // إذا كانت هناك أخطاء أو لم توجد أدوية صحيحة
    if (hasErrors || selectedMedicines.length === 0) {
        return;
    }
    
    // إنشاء طلب من الأدوية المحددة
    createOrderFromSelectedMedicinesList(currentCompanyDetails, selectedMedicines);
}

/**
 * إنشاء طلب من قائمة الأدوية المحددة
 * @param {Object} company - بيانات الشركة
 * @param {Array} selectedMedicines - قائمة الأدوية المحددة
 */
function createOrderFromSelectedMedicinesList(company, selectedMedicines) {
    // تحويل قائمة الأدوية المحددة إلى التنسيق المطلوب للطلب
    const orderItems = selectedMedicines.map(medicine => ({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: medicine.quantity,
        unit_price: medicine.price,
        total_price: medicine.total
    }));
    
    // إنشاء بيانات الطلب
    const orderData = {
        companyId: company.id
    };
    
    // عرض نموذج الطلب مع الأدوية المحددة
    showOrderSummaryModal(company, selectedMedicines, orderData, orderItems);
}

/**
 * تحديث المجموع الإجمالي للطلب
 */
function updateOrderTotal() {
    const container = document.getElementById('orderFormContainer');
    if (!container) return;
    
    const quantityInputs = container.querySelectorAll('input[type="number"]'); 
    let total = 0;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        const price = parseFloat(input.dataset.price) || 0;
        total += quantity * price;
    });
    
    const totalElement = container.querySelector('#totalAmount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
}
}