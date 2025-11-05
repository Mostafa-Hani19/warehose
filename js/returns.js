/**
 * نظام استرجاع الأدوية - Returns Management
 * يتيح للمخازن والصيدليات طلب استرجاع أدوية من الشركات
 */

// متغيرات عامة
let returns = [];
let allCompanies = [];
let filteredReturns = [];

/**
 * تحميل جميع طلبات الاسترجاع
 */
async function loadReturns() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user || !client) return;

    try {
        const { data, error } = await client
            .from('returns')
            .select(`
                *,
                return_items (*)
            `)
            .eq('requester_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        returns = data || [];
        filteredReturns = [...returns];

        renderReturnsTable();
        updateReturnsStats(); // تحديث الإحصائيات والكروت
    } catch (error) {
        console.error('❌ خطأ في جلب طلبات الاسترجاع:', error);
        const tbody = document.getElementById('returnsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-12 text-red-500">
                        <i class="fas fa-exclamation-triangle text-2xl mb-3"></i>
                        <p>حدث خطأ أثناء تحميل طلبات الاسترجاع</p>
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * جلب جميع الشركات المتاحة
 */
async function loadCompaniesForReturns() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user || !client) return;

    try {
        const { data, error } = await client
            .from('companies_users')
            .select(`
                id,
                company_name,
                users!inner(id, name, email)
            `)
            .order('company_name', { ascending: true });

        if (error) throw error;

        allCompanies = (data || []).map(c => ({
            id: c.id,
            name: c.company_name || c.users.name,
            email: c.users.email
        }));

        // تحديث قائمة الشركات في الفلتر
        const companyFilter = document.getElementById('returnCompanyFilter');
        if (companyFilter) {
            companyFilter.innerHTML = '<option value="all">الكل</option>' +
                allCompanies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // تحديث قائمة الشركات في نموذج الاسترجاع
        const modalCompanySelect = document.getElementById('returnModalCompanySelect');
        if (modalCompanySelect) {
            modalCompanySelect.innerHTML = '<option value="">اختر الشركة</option>' +
                allCompanies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    } catch (error) {
        console.error('❌ خطأ في جلب الشركات:', error);
    }
}

/**
 * عرض جدول الاسترجاعات
 */
function renderReturnsTable() {
    const tbody = document.getElementById('returnsTableBody');
    if (!tbody) return;

    if (filteredReturns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>لا توجد طلبات استرجاع</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredReturns.map(returnItem => {
        const statusInfo = getReturnStatusInfo(returnItem.status);
        const returnTypeLabel = getReturnTypeLabel(returnItem.return_type);
        const itemsCount = returnItem.return_items?.length || 0;
        const totalValue = returnItem.total_return_value || 0;

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                    <span class="font-medium text-gray-900">#${returnItem.id.slice(0, 8)}</span>
                </td>
                <td class="py-3 px-4 text-gray-700 font-medium">${returnItem.company_name}</td>
                <td class="py-3 px-4">
                    <span class="inline-block px-2 py-1 text-xs font-medium ${returnItem.return_type === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'} rounded-md">
                        ${returnTypeLabel}
                    </span>
                </td>
                <td class="py-3 px-4 text-gray-700">${itemsCount} دواء</td>
                <td class="py-3 px-4 text-gray-900 font-medium">${formatCurrency(totalValue)}</td>
                <td class="py-3 px-4">
                    <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                        ${statusInfo.label}
                    </span>
                </td>
                <td class="py-3 px-4 text-gray-600">${formatDate(returnItem.created_at)}</td>
                <td class="py-3 px-4">
                    <div class="flex justify-center gap-2">
                        <button onclick="viewReturnDetails('${returnItem.id}')" 
                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${returnItem.status === 'pending' ? `
                        <button onclick="cancelReturn('${returnItem.id}')" 
                                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title="إلغاء الطلب">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * الحصول على معلومات حالة الاسترجاع
 */
function getReturnStatusInfo(status) {
    const statusMap = {
        'pending': { label: 'قيد الانتظار', class: 'bg-yellow-100 text-yellow-800' },
        'approved': { label: 'موافق عليه', class: 'bg-green-100 text-green-800' },
        'rejected': { label: 'مرفوض', class: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
}

/**
 * الحصول على تسمية نوع الاسترجاع
 */
function getReturnTypeLabel(type) {
    const labels = {
        'damaged': 'تالف',
        'expired': 'منتهي الصلاحية'
    };
    return labels[type] || type;
}

/**
 * تصفية طلبات الاسترجاع
 */
function filterReturns() {
    const statusFilter = document.getElementById('returnStatusFilter')?.value || 'all';
    const typeFilter = document.getElementById('returnTypeFilter')?.value || 'all';
    const companyFilter = document.getElementById('returnCompanyFilter')?.value || 'all';
    const searchTerm = document.getElementById('returnSearchInput')?.value.toLowerCase() || '';

    filteredReturns = returns.filter(returnItem => {
        // فلتر الحالة
        if (statusFilter !== 'all' && returnItem.status !== statusFilter) return false;

        // فلتر النوع
        if (typeFilter !== 'all' && returnItem.return_type !== typeFilter) return false;

        // فلتر الشركة
        if (companyFilter !== 'all' && returnItem.company_id !== companyFilter) return false;

        // البحث
        if (searchTerm) {
            const searchText = `${returnItem.company_name} ${returnItem.order_number || ''} ${returnItem.reason || ''}`.toLowerCase();
            if (!searchText.includes(searchTerm)) return false;
        }

        return true;
    });

    renderReturnsTable();
}

/**
 * تحديث إحصائيات الاسترجاعات
 */
function updateReturnsStats() {
    const totalCount = returns.length;
    const pendingCount = returns.filter(r => r.status === 'pending').length;
    const approvedCount = returns.filter(r => r.status === 'approved').length;
    const rejectedCount = returns.filter(r => r.status === 'rejected').length;
    
    // إجمالي قيمة الاسترجاعات المقبولة فقط
    const approvedReturnsValue = returns
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.refund_amount || r.total_return_value || 0), 0);
    
    // إجمالي قيمة جميع الاسترجاعات
    const totalValue = returns.reduce((sum, r) => sum + (r.total_return_value || 0), 0);

    // تحديث الكروت
    const totalCountEl = document.getElementById('totalReturnsCount');
    const pendingCountEl = document.getElementById('pendingReturnsCount');
    const approvedCountEl = document.getElementById('approvedReturnsCount');
    const totalValueEl = document.getElementById('totalReturnsValue');

    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    if (totalValueEl) totalValueEl.textContent = formatCurrency(approvedReturnsValue);

    console.log('📊 إحصائيات الاسترجاعات:', {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        approvedValue: approvedReturnsValue,
        totalValue: totalValue
    });
}

/**
 * فتح نافذة طلب استرجاع جديد
 */
async function openNewReturnModal() {
    await loadCompaniesForReturns();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'newReturnModal';

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900">طلب استرجاع جديد</h3>
                    <button onclick="closeNewReturnModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form id="newReturnForm" onsubmit="submitNewReturn(event)">
                    <!-- معلومات الطلب -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الشركة *</label>
                            <select id="returnModalCompanySelect" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">اختر الشركة</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">نوع الاسترجاع *</label>
                            <select id="returnModalType" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">اختر النوع</option>
                                <option value="damaged">تالف</option>
                                <option value="expired">منتهي الصلاحية</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الطلب (اختياري)</label>
                            <input type="text" id="returnModalOrderNumber"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="رقم الطلب">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">السبب *</label>
                            <textarea id="returnModalReason" required rows="3"
                                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="اذكر سبب الاسترجاع"></textarea>
                        </div>
                    </div>

                    <!-- الأدوية المسترجعة -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-semibold text-gray-900">الأدوية المسترجعة</h4>
                            <button type="button" onclick="addReturnItemRow()" 
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                <i class="fas fa-plus ml-1"></i>إضافة دواء
                            </button>
                        </div>
                        <div id="returnItemsList" class="space-y-3">
                            <!-- سيتم إضافة الصفوف هنا -->
                        </div>
                    </div>

                    <!-- إجمالي القيمة -->
                    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-900">القيمة الإجمالية:</span>
                            <span class="text-xl font-bold text-blue-600" id="returnTotalValue">0.00 جنيه</span>
                        </div>
                    </div>

                    <!-- أزرار الإجراءات -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="closeNewReturnModal()" 
                                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            إلغاء
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            <i class="fas fa-paper-plane ml-2"></i>إرسال الطلب
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // تحديث قائمة الشركات
    const companySelect = document.getElementById('returnModalCompanySelect');
    if (companySelect) {
        companySelect.innerHTML = '<option value="">اختر الشركة</option>' +
            allCompanies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // إضافة صف أول للأدوية
    addReturnItemRow();
}

/**
 * إضافة صف دواء جديد في نموذج الاسترجاع
 */
function addReturnItemRow() {
    const container = document.getElementById('returnItemsList');
    if (!container) return;

    const rowIndex = container.children.length;
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-3 border border-gray-200 rounded-lg return-item-row';
    row.dataset.index = rowIndex;

    row.innerHTML = `
        <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">اسم الدواء *</label>
            <input type="text" class="return-item-name w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                   placeholder="اسم الدواء" required>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">الكمية *</label>
            <input type="number" min="1" class="return-item-quantity w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                   placeholder="الكمية" required onchange="updateReturnTotal()">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
            <input type="number" min="0" step="0.01" class="return-item-price w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                   placeholder="السعر" required onchange="updateReturnTotal()">
        </div>
        <div class="flex items-end">
            <button type="button" onclick="removeReturnItemRow(this)" 
                    class="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(row);
    updateReturnTotal();
}

/**
 * حذف صف دواء من نموذج الاسترجاع
 */
function removeReturnItemRow(button) {
    const row = button.closest('.return-item-row');
    if (row) {
        row.remove();
        updateReturnTotal();
    }
}

/**
 * تحديث الإجمالي في نموذج الاسترجاع
 */
function updateReturnTotal() {
    const container = document.getElementById('returnItemsList');
    if (!container) return;

    const rows = container.querySelectorAll('.return-item-row');
    let total = 0;

    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.return-item-quantity')?.value || 0);
        const price = parseFloat(row.querySelector('.return-item-price')?.value || 0);
        total += quantity * price;
    });

    const totalElement = document.getElementById('returnTotalValue');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

/**
 * إغلاق نافذة طلب الاسترجاع
 */
function closeNewReturnModal() {
    const modal = document.getElementById('newReturnModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * إرسال طلب استرجاع جديد
 */
async function submitNewReturn(event) {
    event.preventDefault();

    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!client || !user) {
        alert('حدث خطأ: لا يمكن الوصول إلى قاعدة البيانات');
        return;
    }

    // جمع البيانات
    const companyId = document.getElementById('returnModalCompanySelect')?.value;
    const companyName = allCompanies.find(c => c.id === companyId)?.name || '';
    const returnType = document.getElementById('returnModalType')?.value;
    const orderNumber = document.getElementById('returnModalOrderNumber')?.value || null;
    const reason = document.getElementById('returnModalReason')?.value;

    if (!companyId || !returnType || !reason) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // جمع الأدوية
    const container = document.getElementById('returnItemsList');
    if (!container) {
        alert('يرجى إضافة دواء واحد على الأقل');
        return;
    }

    const rows = container.querySelectorAll('.return-item-row');
    if (rows.length === 0) {
        alert('يرجى إضافة دواء واحد على الأقل');
        return;
    }

    const returnItems = [];
    let totalValue = 0;

    rows.forEach(row => {
        const name = row.querySelector('.return-item-name')?.value.trim();
        const quantity = parseInt(row.querySelector('.return-item-quantity')?.value || 0);
        const price = parseFloat(row.querySelector('.return-item-price')?.value || 0);

        if (name && quantity > 0 && price >= 0) {
            returnItems.push({
                medicine_name: name,
                quantity: quantity,
                price: price
            });
            totalValue += quantity * price;
        }
    });

    if (returnItems.length === 0) {
        alert('يرجى إضافة دواء واحد على الأقل صحيح');
        return;
    }

    // تحديد نوع المستخدم
    const userType = getUserType(user);

    try {
        // إنشاء طلب الاسترجاع
        const { data: returnData, error: returnError } = await client
            .from('returns')
            .insert([{
                requester_id: user.id,
                requester_type: userType,
                requester_name: user.name || 'غير محدد',
                company_id: companyId,
                company_name: companyName,
                return_type: returnType,
                order_number: orderNumber,
                reason: reason,
                total_return_value: totalValue,
                status: 'pending'
            }])
            .select()
            .single();

        if (returnError) throw returnError;

        // إضافة الأدوية المسترجعة
        const itemsToInsert = returnItems.map(item => ({
            return_id: returnData.id,
            medicine_name: item.medicine_name,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await client
            .from('return_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        console.log('✅ تم إنشاء طلب الاسترجاع بنجاح:', returnData.id);

        alert('✅ تم إرسال طلب الاسترجاع بنجاح');
        closeNewReturnModal();
        await loadReturns();
    } catch (error) {
        console.error('❌ خطأ في إرسال طلب الاسترجاع:', error);
        alert('حدث خطأ أثناء إرسال طلب الاسترجاع: ' + error.message);
    }
}

/**
 * عرض تفاصيل طلب الاسترجاع
 */
async function viewReturnDetails(returnId) {
    const returnItem = returns.find(r => r.id === returnId);
    if (!returnItem) {
        alert('طلب الاسترجاع غير موجود');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'returnDetailsModal';

    const statusInfo = getReturnStatusInfo(returnItem.status);
    const returnTypeLabel = getReturnTypeLabel(returnItem.return_type);
    const itemsList = (returnItem.return_items || []).map(item => `
        <tr>
            <td class="py-3 px-4">${item.medicine_name}</td>
            <td class="py-3 px-4 text-center">${item.quantity}</td>
            <td class="py-3 px-4">${formatCurrency(item.price || 0)}</td>
            <td class="py-3 px-4">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
        </tr>
    `).join('');

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900">تفاصيل طلب الاسترجاع</h3>
                    <button onclick="closeReturnDetailsModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="space-y-4 mb-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">الشركة</p>
                            <p class="font-medium text-gray-900">${returnItem.company_name}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">نوع الاسترجاع</p>
                            <p class="font-medium text-gray-900">${returnTypeLabel}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">الحالة</p>
                            <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                                ${statusInfo.label}
                            </span>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">التاريخ</p>
                            <p class="font-medium text-gray-900">${formatDate(returnItem.created_at)}</p>
                        </div>
                        ${returnItem.order_number ? `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">رقم الطلب</p>
                            <p class="font-medium text-gray-900">${returnItem.order_number}</p>
                        </div>
                        ` : ''}
                        ${returnItem.total_return_value ? `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">القيمة الإجمالية</p>
                            <p class="font-medium text-gray-900">${formatCurrency(returnItem.total_return_value)}</p>
                        </div>
                        ` : ''}
                        ${returnItem.refund_amount ? `
                        <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p class="text-sm text-green-600 mb-1">مبلغ الاسترداد</p>
                            <p class="font-bold text-green-900">${formatCurrency(returnItem.refund_amount)}</p>
                        </div>
                        ` : ''}
                        ${returnItem.status === 'approved' && returnItem.refund_amount ? `
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p class="text-sm text-blue-600 mb-1">تم إضافة المبلغ إلى رصيدك</p>
                            <button onclick="showUserCreditForCompany('${returnItem.company_id}')" 
                                    class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                عرض الرصيد الحالي
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">السبب</p>
                        <p class="font-medium text-gray-900">${returnItem.reason}</p>
                    </div>
                    ${returnItem.approval_message ? `
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p class="text-sm text-blue-600 mb-1">رسالة الموافقة/الرفض</p>
                        <p class="font-medium text-gray-900">${returnItem.approval_message}</p>
                    </div>
                    ` : ''}
                </div>

                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">الأدوية المسترجعة</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="text-right py-3 px-4 font-semibold text-gray-700">اسم الدواء</th>
                                    <th class="text-center py-3 px-4 font-semibold text-gray-700">الكمية</th>
                                    <th class="text-right py-3 px-4 font-semibold text-gray-700">السعر</th>
                                    <th class="text-right py-3 px-4 font-semibold text-gray-700">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsList}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="flex justify-end pt-4 border-t border-gray-200">
                    <button onclick="closeReturnDetailsModal()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * إغلاق نافذة تفاصيل الاسترجاع
 */
function closeReturnDetailsModal() {
    const modal = document.getElementById('returnDetailsModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * إلغاء طلب استرجاع
 */
async function cancelReturn(returnId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
        return;
    }

    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!client || !user) return;

    try {
        const { error } = await client
            .from('returns')
            .delete()
            .eq('id', returnId)
            .eq('requester_id', user.id)
            .eq('status', 'pending');

        if (error) throw error;

        alert('✅ تم إلغاء الطلب بنجاح');
        await loadReturns();
    } catch (error) {
        console.error('❌ خطأ في إلغاء الطلب:', error);
        alert('حدث خطأ أثناء إلغاء الطلب: ' + error.message);
    }
}

/**
 * تحديد نوع المستخدم
 */
function getUserType(user) {
    if (user.role === 'warehouse') return 'warehouse';
    if (user.role === 'pharmacy') return 'pharmacy';
    return 'warehouse'; // افتراضي
}

/**
 * تحديث حالة طلب الاسترجاع (للشركة - قبول/رفض)
 * هذه الدالة تستخدم عند قبول أو رفض طلب الاسترجاع من الشركة
 */
async function updateReturnStatus(returnId, status, approvalMessage = null, refundAmount = null) {
    if (typeof updateReturnStatusInSupabase === 'function') {
        try {
            const result = await updateReturnStatusInSupabase(returnId, status, approvalMessage, refundAmount);
            if (result) {
                if (typeof showNotification === 'function') {
                    showNotification('تم تحديث حالة طلب الاسترجاع بنجاح', 'success');
                }
                // إعادة تحميل الطلبات
                await loadReturns();
                return true;
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('حدث خطأ أثناء تحديث حالة الطلب', 'error');
                }
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث حالة الاسترجاع:', error);
            if (typeof showNotification === 'function') {
                showNotification('حدث خطأ: ' + error.message, 'error');
            }
            return false;
        }
    } else {
        console.error('❌ دالة updateReturnStatusInSupabase غير متاحة');
        return false;
    }
}

/**
 * عرض الرصيد الحالي للمستخدم من الشركة
 */
async function showUserCreditForCompany(companyId) {
    const user = getCurrentUser();
    if (!user || typeof getUserCompanyCredit !== 'function') return;

    try {
        const credit = await getUserCompanyCredit(user.id, companyId);
        const company = allCompanies.find(c => c.id === companyId);
        const companyName = company?.name || 'الشركة';
        
        if (credit > 0) {
            if (typeof showNotification === 'function') {
                showNotification(`رصيدك لدى ${companyName}: ${formatCurrency(credit)}`, 'info');
            } else {
                alert(`رصيدك لدى ${companyName}: ${formatCurrency(credit)}`);
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification(`لا يوجد رصيد لديك لدى ${companyName}`, 'info');
            } else {
                alert(`لا يوجد رصيد لديك لدى ${companyName}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في جلب الرصيد:', error);
        if (typeof showNotification === 'function') {
            showNotification('حدث خطأ أثناء جلب الرصيد', 'error');
        }
    }
}

// جعل الدوال متاحة عالمياً
window.loadReturns = loadReturns;
window.loadCompaniesForReturns = loadCompaniesForReturns;
window.filterReturns = filterReturns;
window.openNewReturnModal = openNewReturnModal;
window.addReturnItemRow = addReturnItemRow;
window.removeReturnItemRow = removeReturnItemRow;
window.updateReturnTotal = updateReturnTotal;
window.submitNewReturn = submitNewReturn;
window.closeNewReturnModal = closeNewReturnModal;
window.viewReturnDetails = viewReturnDetails;
window.closeReturnDetailsModal = closeReturnDetailsModal;
window.cancelReturn = cancelReturn;
window.updateReturnStatus = updateReturnStatus;
window.showUserCreditForCompany = showUserCreditForCompany;

