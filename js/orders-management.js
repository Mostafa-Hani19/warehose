/**
 * إدارة الطلبات - دوال مساعدة للطلبات المطلوبة والواردة
 */

// متغيرات عامة
let filteredOrders = [];
let currentSortColumn = null;
let currentSortDirection = 'desc';

/**
 * الحصول على معلومات حالة الطلب
 */
function getOrderStatusInfo(status) {
    const statusMap = {
        'pending': { label: 'قيد الانتظار', class: 'bg-yellow-100 text-yellow-800' },
        'confirmed': { label: 'مؤكد', class: 'bg-blue-100 text-blue-800' },
        'processing': { label: 'قيد المعالجة', class: 'bg-purple-100 text-purple-800' },
        'shipped': { label: 'تم الشحن', class: 'bg-indigo-100 text-indigo-800' },
        'delivered': { label: 'تم التسليم', class: 'bg-green-100 text-green-800' },
        'cancelled': { label: 'ملغي', class: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
}

/**
 * تصفية الطلبات حسب الحالة والبحث
 */
function filterOrders(ordersList) {
    const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
    const searchInput = document.getElementById('orderSearchInput')?.value.toLowerCase() || '';
    
    let filtered = ordersList;
    
    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // تصفية حسب البحث
    if (searchInput) {
        filtered = filtered.filter(order => 
            order.orderNumber.toLowerCase().includes(searchInput) ||
            order.companyName?.toLowerCase().includes(searchInput) ||
            order.pharmacy?.toLowerCase().includes(searchInput)
        );
    }
    
    return filtered;
}

/**
 * تصفية الطلبات الواردة
 */
function filterIncomingOrders(ordersList) {
    const statusFilter = document.getElementById('incomingOrderStatusFilter')?.value || 'all';
    const searchInput = document.getElementById('incomingOrderSearchInput')?.value.toLowerCase() || '';
    
    let filtered = ordersList;
    
    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // تصفية حسب البحث
    if (searchInput) {
        filtered = filtered.filter(order => 
            order.orderNumber.toLowerCase().includes(searchInput) ||
            order.pharmacy?.toLowerCase().includes(searchInput)
        );
    }
    
    return filtered;
}

/**
 * تحديث إحصائيات الطلبات
 */
function updateOrdersStats() {
    const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    
    // تحديث الإحصائيات
    const totalAmountEl = document.getElementById('totalOrdersAmount');
    const totalCountEl = document.getElementById('totalOrdersCount');
    const pendingCountEl = document.getElementById('pendingOrdersCount');
    const deliveredCountEl = document.getElementById('deliveredOrdersCount');
    const cancelledCountEl = document.getElementById('cancelledOrdersCount');
    
    if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (deliveredCountEl) deliveredCountEl.textContent = deliveredCount;
    if (cancelledCountEl) cancelledCountEl.textContent = cancelledCount;
}

/**
 * تحديث إحصائيات الطلبات الواردة
 */
function updateIncomingOrdersStats() {
    const totalAmount = incomingOrders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
    const totalCount = incomingOrders.length;
    const pendingCount = incomingOrders.filter(o => o.status === 'pending').length;
    const deliveredCount = incomingOrders.filter(o => o.status === 'delivered').length;
    const cancelledCount = incomingOrders.filter(o => o.status === 'cancelled').length;
    
    // تحديث الإحصائيات
    const totalAmountEl = document.getElementById('totalIncomingOrdersAmount');
    const totalCountEl = document.getElementById('totalIncomingOrdersCount');
    const pendingCountEl = document.getElementById('pendingIncomingOrdersCount');
    const deliveredCountEl = document.getElementById('deliveredIncomingOrdersCount');
    const cancelledCountEl = document.getElementById('cancelledIncomingOrdersCount');
    
    if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (deliveredCountEl) deliveredCountEl.textContent = deliveredCount;
    if (cancelledCountEl) cancelledCountEl.textContent = cancelledCount;
}

/**
 * عرض تفاصيل الطلب
 */
function viewOrderDetails(orderId) {
    // الوصول إلى المتغيرات من النطاق العام
    const ordersList = typeof orders !== 'undefined' ? orders : [];
    const incomingOrdersList = typeof incomingOrders !== 'undefined' ? incomingOrders : [];
    
    const order = ordersList.find(o => o.id === orderId) || incomingOrdersList.find(o => o.id === orderId);
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    // تحديد إذا كان الطلب وارداً (من incomingOrders)
    const isIncomingOrder = incomingOrdersList.some(o => o.id === orderId);
    
    const statusInfo = getOrderStatusInfo(order.status);
    const itemsList = order.orderItems?.map(item => {
        // استخراج الكمية المجانية والكمية الأصلية من batch_number إذا كانت موجودة
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
        
        return `
        <tr class="border-b border-gray-100">
            <td class="py-3 px-4">
                <div>
                    <p class="font-medium text-gray-900">${item.medicine_name}</p>
                    ${freeQuantity > 0 ? `<p class="text-xs text-green-600 mt-1">🎁 خصم: شراء ${originalQuantity} واحصل على ${freeQuantity} مجاناً</p>` : ''}
                </div>
            </td>
            <td class="py-3 px-4 text-center">
                <div>
                    <span class="font-medium">${originalQuantity}</span>
                    ${freeQuantity > 0 ? `<span class="text-green-600 font-semibold"> + ${freeQuantity}</span>` : ''}
                    ${freeQuantity > 0 ? `<div class="text-xs text-gray-500 mt-1">(إجمالي: ${item.quantity})</div>` : ''}
                </div>
            </td>
            <td class="py-3 px-4 text-left">${formatCurrency(item.price)}</td>
            <td class="py-3 px-4 text-left font-medium">${formatCurrency(item.total_price)}</td>
        </tr>
    `;
    }).join('') || '<tr><td colspan="4" class="py-4 text-center text-gray-500">لا توجد أدوية</td></tr>';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'orderDetailsModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-900">تفاصيل الطلب ${order.orderNumber}</h3>
                    <button onclick="closeOrderDetailsModal()" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6">
                <!-- معلومات الطلب -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">${order.companyName ? 'الشركة' : 'الصيدلية'}</p>
                        <p class="font-medium text-gray-900">${order.companyName || order.pharmacy || 'غير محدد'}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">التاريخ</p>
                        <p class="font-medium text-gray-900">${formatDate(order.date)}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">طريقة الدفع</p>
                        <p class="font-medium text-gray-900">${order.paymentMethod || 'غير محدد'}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">الحالة</p>
                        <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>
                
                <!-- جدول الأدوية -->
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">الأدوية المطلوبة</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="text-right py-3 px-4 font-semibold text-gray-700">اسم الدواء</th>
                                    <th class="text-center py-3 px-4 font-semibold text-gray-700">الكمية</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">السعر</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsList}
                            </tbody>
                            <tfoot class="bg-gray-50">
                                <tr>
                                    <td colspan="3" class="py-3 px-4 text-right font-semibold text-gray-900">المجموع الإجمالي:</td>
                                    <td class="py-3 px-4 text-left font-bold text-blue-600">${formatCurrency(order.amount)}</td>
                                ${order.totalDiscount > 0 ? `
                                    <tr>
                                        <td colspan="3" class="py-2 px-4 text-right font-medium text-gray-600">المجموع قبل الخصم:</td>
                                        <td class="py-2 px-4 text-left text-gray-600 line-through">${formatCurrency(order.originalAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" class="py-2 px-4 text-right font-medium text-green-600">إجمالي الخصم:</td>
                                        <td class="py-2 px-4 text-left font-bold text-green-600">-${formatCurrency(order.totalDiscount)}</td>
                                    </tr>
                                ` : ''}
                                <tr class="border-t-2 border-gray-200">
                                    <td colspan="3" class="py-3 px-4 text-right font-bold text-gray-900 text-lg">المجموع الإجمالي:</td>
                                    <td class="py-3 px-4 text-left font-bold text-blue-600 text-lg">${formatCurrency(order.amount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                ${!isIncomingOrder && order.companyId ? `
                <!-- عرض الرصيد المتاح -->
                <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">الرصيد المتاح لدى ${order.companyName || 'الشركة'}</p>
                            <p class="text-2xl font-bold text-blue-600" id="orderCreditBalance-${order.id}">جاري التحميل...</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-wallet text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- أزرار الإجراءات -->
                <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    ${!isIncomingOrder && order.status !== 'shipped' && order.status !== 'delivered' ? `
                    <button onclick="editOrder('${order.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <i class="fas fa-edit ml-2"></i>تعديل الطلب
                    </button>
                    ` : ''}
                    ${isIncomingOrder ? `
                    <select onchange="updateIncomingOrderStatus('${order.id}', this.value)" 
                            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد المعالجة</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                    ` : ''}
                    <button onclick="closeOrderDetailsModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // جلب الرصيد المتاح إذا كان الطلب من شركة
    if (!isIncomingOrder && order.companyId && typeof getUserCompanyCredit === 'function') {
        const user = getCurrentUser();
        if (user) {
            getUserCompanyCredit(user.id, order.companyId)
                .then(credit => {
                    const creditEl = document.getElementById(`orderCreditBalance-${order.id}`);
                    if (creditEl) {
                        creditEl.textContent = formatCurrency(credit);
                    }
                })
                .catch(error => {
                    console.error('❌ خطأ في جلب الرصيد:', error);
                    const creditEl = document.getElementById(`orderCreditBalance-${order.id}`);
                    if (creditEl) {
                        creditEl.textContent = '0.00 جنيه';
                    }
                });
        }
    }
}

/**
 * إغلاق نافذة تفاصيل الطلب
 */
function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * طباعة الطلب
 */
function printOrder(orderId) {
    const order = orders.find(o => o.id === orderId) || incomingOrders.find(o => o.id === orderId);
    if (!order) {
        alert('الطلب غير موجود');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const statusInfo = getOrderStatusInfo(order.status);
    const itemsList = order.orderItems?.map(item => {
        // استخراج الكمية المجانية والكمية الأصلية من batch_number إذا كانت موجودة
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
        
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">
                <div>
                    <strong>${item.medicine_name}</strong>
                    ${freeQuantity > 0 ? `<div style="color: #10b981; font-size: 12px; margin-top: 4px;">🎁 خصم: شراء ${originalQuantity} واحصل على ${freeQuantity} مجاناً</div>` : ''}
                </div>
            </td>
            <td style="padding: 12px; text-align: center;">
                <div>
                    <strong>${originalQuantity}</strong>
                    ${freeQuantity > 0 ? `<span style="color: #10b981; font-weight: bold;"> + ${freeQuantity}</span>` : ''}
                    ${freeQuantity > 0 ? `<div style="color: #6b7280; font-size: 11px; margin-top: 2px;">(إجمالي: ${item.quantity})</div>` : ''}
                </div>
            </td>
            <td style="padding: 12px; text-align: left;">${formatCurrency(item.price)}</td>
            <td style="padding: 12px; text-align: left; font-weight: 600;">${formatCurrency(item.total_price)}</td>
        </tr>
    `;
    }).join('') || '<tr><td colspan="4" style="padding: 16px; text-align: center;">لا توجد أدوية</td></tr>';
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة الطلب ${order.orderNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background-color: #f3f4f6; padding: 12px; text-align: right; font-weight: bold; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                .total { font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>طلب رقم: ${order.orderNumber}</h1>
                <p>تاريخ: ${formatDate(order.date)}</p>
            </div>
            
            <div class="info">
                <p><strong>${order.companyName ? 'الشركة' : 'الصيدلية'}:</strong> ${order.companyName || order.pharmacy || 'غير محدد'}</p>
                <p><strong>طريقة الدفع:</strong> ${order.paymentMethod || 'غير محدد'}</p>
                <p><strong>الحالة:</strong> ${statusInfo.label}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>اسم الدواء</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold;">المجموع الإجمالي:</td>
                        <td class="total">${formatCurrency(order.amount)}</td>
                    </tr>
                </tfoot>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

/**
 * تحديث حالة الطلب الوارد (من صفحة الطلبات الواردة)
 */
async function updateIncomingOrderStatus(orderId, newStatus) {
    try {
        // استخدام الدالة من supabase-integration.js مباشرة
        const client = getSupabaseClient();
        const user = getCurrentUser();
        if (!client || !user) {
            alert('حدث خطأ: لا يمكن الوصول إلى قاعدة البيانات');
            return;
        }
        
        // تحديث حالة الطلب في Supabase
        // للطلبات الواردة، نحتاج للتحقق من warehouse_id أو company_id
        const { data, error } = await client
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log('✅ تم تحديث حالة الطلب:', data.order_number);
        
        if (typeof showNotification === 'function') {
            showNotification('تم تحديث حالة الطلب بنجاح', 'success');
        }
        
        // إعادة تحميل الطلبات الواردة فقط
        if (typeof loadIncomingOrders === 'function') {
            await loadIncomingOrders();
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error);
        if (typeof showNotification === 'function') {
            showNotification('حدث خطأ أثناء تحديث حالة الطلب: ' + (error.message || 'خطأ غير معروف'), 'error');
        } else {
            alert('حدث خطأ أثناء تحديث حالة الطلب: ' + (error.message || 'خطأ غير معروف'));
        }
    }
}

// إعداد مستمعي الأحداث للفلاتر
document.addEventListener('DOMContentLoaded', function() {
    // فلاتر الطلبات المطلوبة
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    const orderSearchInput = document.getElementById('orderSearchInput');
    const resetOrderFiltersBtn = document.getElementById('resetOrderFiltersBtn');
    
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', () => {
            if (typeof loadOrders === 'function') loadOrders();
        });
    }
    
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', () => {
            if (typeof loadOrders === 'function') loadOrders();
        });
    }
    
    if (resetOrderFiltersBtn) {
        resetOrderFiltersBtn.addEventListener('click', () => {
            if (orderStatusFilter) orderStatusFilter.value = 'all';
            if (orderSearchInput) orderSearchInput.value = '';
            if (typeof loadOrders === 'function') loadOrders();
        });
    }
    
    // فلاتر الطلبات الواردة
    const incomingOrderStatusFilter = document.getElementById('incomingOrderStatusFilter');
    const incomingOrderSearchInput = document.getElementById('incomingOrderSearchInput');
    const resetIncomingOrderFiltersBtn = document.getElementById('resetIncomingOrderFiltersBtn');
    
    if (incomingOrderStatusFilter) {
        incomingOrderStatusFilter.addEventListener('change', () => {
            if (typeof loadIncomingOrders === 'function') loadIncomingOrders();
        });
    }
    
    if (incomingOrderSearchInput) {
        incomingOrderSearchInput.addEventListener('input', () => {
            if (typeof loadIncomingOrders === 'function') loadIncomingOrders();
        });
    }
    
    if (resetIncomingOrderFiltersBtn) {
        resetIncomingOrderFiltersBtn.addEventListener('click', () => {
            if (incomingOrderStatusFilter) incomingOrderStatusFilter.value = 'all';
            if (incomingOrderSearchInput) incomingOrderSearchInput.value = '';
            if (typeof loadIncomingOrders === 'function') loadIncomingOrders();
        });
    }
});

// جعل الدوال متاحة عالمياً
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.printOrder = printOrder;
window.updateOrderStatusInSupabase = updateOrderStatusInSupabase;
window.updateIncomingOrderStatus = updateIncomingOrderStatus;
window.filterOrders = filterOrders;
window.filterIncomingOrders = filterIncomingOrders;
window.updateOrdersStats = updateOrdersStats;
window.updateIncomingOrdersStats = updateIncomingOrdersStats;
window.getOrderStatusInfo = getOrderStatusInfo;

   
