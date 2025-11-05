/**
 * وظائف تحديث الإحصائيات
 * يحتوي على جميع الوظائف المتعلقة بتحديث الإحصائيات في لوحة التحكم
 */

/**
 * تحديث الإحصائيات في لوحة التحكم
 */
function updateDashboardStats() {
    // تحديث اسم المستخدم
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && user.name) {
        const greetingEl = document.getElementById('userGreeting');
        if (greetingEl) {
            greetingEl.textContent = `مرحباً، ${user.name}`;
        }
    }
    
    // تحديث إجمالي الأدوية
    const totalMedicines = typeof medicines !== 'undefined' ? medicines.length : 0;
    const totalMedicinesEl = document.getElementById('totalMedicines');
    if (totalMedicinesEl) {
        totalMedicinesEl.textContent = totalMedicines;
    }
    
    const totalMedicinesStatsEl = document.getElementById('totalMedicinesStats');
    if (totalMedicinesStatsEl) {
        totalMedicinesStatsEl.textContent = `${totalMedicines} دواء`;
    }
    
    // تحديث إجمالي الشركات
    const totalCompanies = typeof companies !== 'undefined' ? companies.length : 0;
    const totalCompaniesEl = document.getElementById('totalCompanies');
    if (totalCompaniesEl) {
        totalCompaniesEl.textContent = `${totalCompanies} شركة`;
    }
    
    // تحديث إجمالي الشركات في النظام
    const totalSystemCompanies = typeof allSystemCompanies !== 'undefined' ? allSystemCompanies.length : 0;
    const totalSystemCompaniesEl = document.getElementById('totalSystemCompanies');
    if (totalSystemCompaniesEl) {
        totalSystemCompaniesEl.textContent = `${totalSystemCompanies}`;
    }
    
    // تحديث إجمالي الشركات في النظام (في لوحة التحكم)
    const totalSystemCompaniesDashboardEl = document.getElementById('totalSystemCompaniesDashboard');
    if (totalSystemCompaniesDashboardEl) {
        totalSystemCompaniesDashboardEl.textContent = totalSystemCompanies;
    }
    
    // تحديث إجمالي الطلبات
    const totalOrders = typeof orders !== 'undefined' ? orders.length : 0;
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) {
        totalOrdersEl.textContent = totalOrders;
    }
    
    const totalOrdersCountEl = document.getElementById('totalOrdersCount');
    if (totalOrdersCountEl) {
        totalOrdersCountEl.textContent = totalOrders;
    }

    // إحصائيات تفصيلية للطلبات (قيمة إجمالية/حالات)
    if (typeof orders !== 'undefined' && Array.isArray(orders)) {
        const totalOrdersAmount = orders.reduce((sum, o) => sum + (parseFloat(o.amount || o.final_amount || o.total_amount || 0) || 0), 0);
        const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
        const confirmedOrdersCount = orders.filter(o => o.status === 'confirmed').length;
        const processingOrdersCount = orders.filter(o => o.status === 'processing').length;
        const shippedOrdersCount = orders.filter(o => o.status === 'shipped').length;
        const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;

        const totalOrdersAmountEl = document.getElementById('totalOrdersAmount');
        if (totalOrdersAmountEl && typeof formatCurrency === 'function') {
            totalOrdersAmountEl.textContent = formatCurrency(totalOrdersAmount);
        } else if (totalOrdersAmountEl) {
            totalOrdersAmountEl.textContent = `${totalOrdersAmount.toFixed(2)} جنيه`;
        }

        const pendingOrdersCountEl = document.getElementById('pendingOrdersCount');
        if (pendingOrdersCountEl) pendingOrdersCountEl.textContent = pendingOrdersCount;
        const confirmedOrdersCountEl = document.getElementById('confirmedOrdersCount');
        if (confirmedOrdersCountEl) confirmedOrdersCountEl.textContent = confirmedOrdersCount;
        const processingOrdersCountEl = document.getElementById('processingOrdersCount');
        if (processingOrdersCountEl) processingOrdersCountEl.textContent = processingOrdersCount;
        const shippedOrdersCountEl = document.getElementById('shippedOrdersCount');
        if (shippedOrdersCountEl) shippedOrdersCountEl.textContent = shippedOrdersCount;
        const deliveredOrdersCountEl = document.getElementById('deliveredOrdersCount');
        if (deliveredOrdersCountEl) deliveredOrdersCountEl.textContent = deliveredOrdersCount;
    }
    
    // تحديث إجمالي الطلبات الواردة
    const totalIncomingOrders = typeof incomingOrders !== 'undefined' ? incomingOrders.length : 0;
    const totalIncomingOrdersCountEl = document.getElementById('totalIncomingOrdersCount');
    if (totalIncomingOrdersCountEl) {
        totalIncomingOrdersCountEl.textContent = totalIncomingOrders;
    }
    // إحصائيات تفصيلية للطلبات الواردة
    if (typeof incomingOrders !== 'undefined' && Array.isArray(incomingOrders)) {
        const totalIncomingOrdersAmount = incomingOrders.reduce((sum, o) => sum + (parseFloat(o.amount || o.final_amount || o.total_amount || 0) || 0), 0);
        const pendingIncomingOrdersCount = incomingOrders.filter(o => o.status === 'pending').length;
        const confirmedIncomingOrdersCount = incomingOrders.filter(o => o.status === 'confirmed').length;
        const processingIncomingOrdersCount = incomingOrders.filter(o => o.status === 'processing').length;
        const shippedIncomingOrdersCount = incomingOrders.filter(o => o.status === 'shipped').length;
        const deliveredIncomingOrdersCount = incomingOrders.filter(o => o.status === 'delivered').length;

        const totalIncomingOrdersAmountEl = document.getElementById('totalIncomingOrdersAmount');
        if (totalIncomingOrdersAmountEl && typeof formatCurrency === 'function') {
            totalIncomingOrdersAmountEl.textContent = formatCurrency(totalIncomingOrdersAmount);
        } else if (totalIncomingOrdersAmountEl) {
            totalIncomingOrdersAmountEl.textContent = `${totalIncomingOrdersAmount.toFixed(2)} جنيه`;
        }

        const pendingIncomingOrdersCountEl = document.getElementById('pendingIncomingOrdersCount');
        if (pendingIncomingOrdersCountEl) pendingIncomingOrdersCountEl.textContent = pendingIncomingOrdersCount;
        const confirmedIncomingOrdersCountEl = document.getElementById('confirmedIncomingOrdersCount');
        if (confirmedIncomingOrdersCountEl) confirmedIncomingOrdersCountEl.textContent = confirmedIncomingOrdersCount;
        const processingIncomingOrdersCountEl = document.getElementById('processingIncomingOrdersCount');
        if (processingIncomingOrdersCountEl) processingIncomingOrdersCountEl.textContent = processingIncomingOrdersCount;
        const shippedIncomingOrdersCountEl = document.getElementById('shippedIncomingOrdersCount');
        if (shippedIncomingOrdersCountEl) shippedIncomingOrdersCountEl.textContent = shippedIncomingOrdersCount;
        const deliveredIncomingOrdersCountEl = document.getElementById('deliveredIncomingOrdersCount');
        if (deliveredIncomingOrdersCountEl) deliveredIncomingOrdersCountEl.textContent = deliveredIncomingOrdersCount;
    }
    
    // حساب الأدوية منتهية الصلاحية
    let expiredCount = 0;
    if (typeof medicines !== 'undefined') {
        const now = new Date();
        expiredCount = medicines.filter(m => {
            const expiryDate = new Date(m.expiryDate);
            return expiryDate < now;
        }).length;
    }
    
    const expiredMedicinesEl = document.getElementById('expiredMedicines');
    if (expiredMedicinesEl) {
        expiredMedicinesEl.textContent = expiredCount;
    }
    
    // حساب الأدوية منخفضة المخزون
    let lowStockCount = 0;
    if (typeof medicines !== 'undefined') {
        lowStockCount = medicines.filter(m => m.quantity < 50).length;
    }
    
    const lowStockMedicinesEl = document.getElementById('lowStockMedicines');
    if (lowStockMedicinesEl) {
        lowStockMedicinesEl.textContent = lowStockCount;
    }
    
    // حساب إجمالي الكمية
    let totalQuantity = 0;
    if (typeof medicines !== 'undefined') {
        totalQuantity = medicines.reduce((sum, m) => sum + m.quantity, 0);
    }
    
    const totalQuantityEl = document.getElementById('totalQuantity');
    if (totalQuantityEl) {
        totalQuantityEl.textContent = totalQuantity;
    }
    
    // تحديث التنبيهات
    updateAlerts();
    
    // تحديث الأدوية الأكثر حركة
    updateTopMedicines();
}

/**
 * تحديث التنبيهات
 */
function updateAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    let expiredCount = 0;
    if (typeof medicines !== 'undefined') {
        expiredCount = medicines.filter(m => {
            const expiryDate = new Date(m.expiryDate);
            return expiryDate < new Date();
        }).length;
    }
    
    let lowStockCount = 0;
    if (typeof medicines !== 'undefined') {
        lowStockCount = medicines.filter(m => m.quantity < 50).length;
    }
    
    if (expiredCount === 0 && lowStockCount === 0) {
        alertsContainer.innerHTML = '<p class="text-sm text-gray-600 text-center py-4">لا توجد تنبيهات حالياً</p>';
        return;
    }
    
    if (expiredCount > 0) {
        const alert = document.createElement('div');
        alert.className = 'flex items-center p-3 bg-red-50 border-r-4 border-red-400 rounded';
        alert.innerHTML = `
            <i class="fas fa-clock text-red-600 ml-3"></i>
            <div>
                <p class="text-sm font-medium text-red-800">أدوية منتهية الصلاحية</p>
                <p class="text-xs text-red-600">${expiredCount} أدوية منتهية الصلاحية</p>
            </div>
        `;
        alertsContainer.appendChild(alert);
    }
    
    if (lowStockCount > 0) {
        const alert = document.createElement('div');
        alert.className = 'flex items-center p-3 bg-orange-50 border-r-4 border-orange-400 rounded';
        alert.innerHTML = `
            <i class="fas fa-box text-orange-600 ml-3"></i>
            <div>
                <p class="text-sm font-medium text-orange-800">نفاد المخزون</p>
                <p class="text-xs text-orange-600">${lowStockCount} دواء يحتاج إعادة تموين</p>
            </div>
        `;
        alertsContainer.appendChild(alert);
    }
}

/**
 * تحديث الأدوية الأكثر حركة
 */
function updateTopMedicines() {
    const container = document.getElementById('topMedicinesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (typeof medicines === 'undefined' || medicines.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-600 text-center py-4">لا توجد بيانات حالياً</p>';
        return;
    }
    
    // ترتيب الأدوية حسب الكمية (الأكثر توفراً)
    const topMeds = [...medicines]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    
    topMeds.forEach((med, index) => {
        const item = document.createElement('div');
        const colors = [
            'bg-red-50 text-red-700',
            'bg-orange-50 text-orange-700',
            'bg-yellow-50 text-yellow-700',
            'bg-blue-50 text-blue-700',
            'bg-gray-50 text-gray-700'
        ];
        
        item.className = 'flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 ${colors[index]} rounded-lg flex items-center justify-center font-bold text-sm">
                    ${index + 1}
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${med.name}</p>
                    <p class="text-xs text-gray-500">${med.company || 'غير محدد'}</p>
                </div>
            </div>
            <div class="text-left">
                <p class="text-sm font-bold text-gray-900">${med.quantity}</p>
                <p class="text-xs text-gray-500">وحدة</p>
            </div>
        `;
        container.appendChild(item);
    });
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateDashboardStats,
        updateAlerts,
        updateTopMedicines
    };
}