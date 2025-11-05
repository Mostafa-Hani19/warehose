/**
 * إدارة الخصومات - تطبيق الخصومات على الطلبات
 */

/**
 * التحقق من صلاحية الخصم
 */
function isDiscountValid(discount) {
    if (!discount.is_active) return false;
    
    const now = new Date();
    
    // التحقق من تاريخ البداية
    if (discount.start_date) {
        const startDate = new Date(discount.start_date);
        if (now < startDate) return false;
    }
    
    // التحقق من تاريخ الانتهاء
    if (discount.end_date) {
        const endDate = new Date(discount.end_date);
        if (now > endDate) return false;
    }
    
    return true;
}

/**
 * تطبيق الخصومات على الأدوية المحددة
 * @param {Array} selectedMedicines - قائمة الأدوية المحددة
 * @param {Array} discounts - قائمة الخصومات المتاحة
 * @param {number} totalAmount - المبلغ الإجمالي قبل الخصومات
 * @returns {Object} - النتيجة مع الخصومات المطبقة والمبلغ النهائي
 */
function applyDiscounts(selectedMedicines, discounts, totalAmount) {
    if (!discounts || discounts.length === 0) {
        return {
            appliedDiscounts: [],
            totalDiscount: 0,
            finalAmount: totalAmount,
            originalAmount: totalAmount
        };
    }
    
    // تصفية الخصومات الصالحة فقط
    const validDiscounts = discounts.filter(isDiscountValid);
    
    console.log('🔍 الخصومات الصالحة:', validDiscounts);
    console.log('🔍 الأدوية المدخلة:', selectedMedicines);
    
    let appliedDiscounts = [];
    let totalDiscountAmount = 0;
    let medicinesWithDiscounts = selectedMedicines.map(m => ({ ...m }));
    
    console.log('🔍 medicinesWithDiscounts قبل التطبيق:', medicinesWithDiscounts);
    
    // تطبيق خصومات على الأدوية الفردية (إذا كان للدواء خصم محدد)
    validDiscounts.forEach(discount => {
        if (discount.medicine_id && discount.discount_type === 'percentage') {
            medicinesWithDiscounts.forEach(medicine => {
                // مقارنة معرفات الأدوية (يمكن أن تكون UUID أو نصوص)
                const medicineIdMatch = medicine.id === discount.medicine_id || 
                                       medicine.id?.toString() === discount.medicine_id?.toString() ||
                                       String(medicine.id) === String(discount.medicine_id);
                
                if (medicineIdMatch && discount.percentage) {
                    const discountAmount = (medicine.total * discount.percentage / 100);
                    medicine.discountAmount = discountAmount;
                    medicine.discountedTotal = medicine.total - discountAmount;
                    medicine.appliedDiscount = discount;
                    
                    appliedDiscounts.push({
                        type: 'medicine',
                        discount: discount,
                        medicine: medicine.name,
                        amount: discountAmount
                    });
                    
                    totalDiscountAmount += discountAmount;
                }
            });
        }
        // تطبيق خصم buy_get على دواء معين
        else if (discount.medicine_id && discount.discount_type === 'buy_get') {
            console.log('🔍 فحص خصم buy_get:', {
                discountId: discount.id,
                discountMedicineId: discount.medicine_id,
                discountMedicineIdType: typeof discount.medicine_id,
                buyQuantity: discount.buy_quantity,
                getQuantity: discount.get_quantity,
                isActive: discount.is_active
            });
            
            medicinesWithDiscounts.forEach(medicine => {
                // مقارنة معرفات الأدوية (يمكن أن تكون UUID أو نصوص)
                const medicineIdMatch = medicine.id === discount.medicine_id || 
                                       medicine.id?.toString() === discount.medicine_id?.toString() ||
                                       String(medicine.id) === String(discount.medicine_id);
                
                console.log('🔍 مقارنة الدواء:', {
                    medicineId: medicine.id,
                    medicineIdType: typeof medicine.id,
                    discountMedicineId: discount.medicine_id,
                    discountMedicineIdType: typeof discount.medicine_id,
                    exactMatch: medicine.id === discount.medicine_id,
                    stringMatch: String(medicine.id) === String(discount.medicine_id),
                    toStringMatch: medicine.id?.toString() === discount.medicine_id?.toString(),
                    match: medicineIdMatch,
                    medicineQuantity: medicine.quantity,
                    buyQuantity: discount.buy_quantity
                });
                
                if (medicineIdMatch && discount.buy_quantity && discount.get_quantity) {
                    if (medicine.quantity >= discount.buy_quantity) {
                        const freeQuantity = Math.floor(medicine.quantity / discount.buy_quantity) * discount.get_quantity;
                        console.log('✅ تطبيق خصم buy_get - قبل الإضافة:', {
                            medicine: medicine.name,
                            quantity: medicine.quantity,
                            buyQuantity: discount.buy_quantity,
                            getQuantity: discount.get_quantity,
                            freeQuantity: freeQuantity
                        });
                        
                        medicine.freeQuantity = freeQuantity;
                        medicine.originalQuantity = medicine.quantity; // حفظ الكمية الأصلية
                        medicine.totalQuantity = medicine.quantity + freeQuantity;
                        medicine.appliedDiscount = discount;
                        
                        console.log('✅ تطبيق خصم buy_get - بعد الإضافة:', {
                            medicine: medicine.name,
                            quantity: medicine.quantity,
                            freeQuantity: medicine.freeQuantity,
                            originalQuantity: medicine.originalQuantity,
                            totalQuantity: medicine.totalQuantity,
                            medicineObject: JSON.parse(JSON.stringify(medicine))
                        });
                        
                        appliedDiscounts.push({
                            type: 'buy_get',
                            discount: discount,
                            medicine: medicine.name,
                            description: `شراء ${discount.buy_quantity} واحصل على ${discount.get_quantity} مجاناً`,
                            freeQuantity: freeQuantity,
                            medicineId: medicine.id // إضافة معرف الدواء للبحث السريع
                        });
                    } else {
                        console.log('❌ الكمية غير كافية:', {
                            medicine: medicine.name,
                            quantity: medicine.quantity,
                            required: discount.buy_quantity
                        });
                    }
                } else {
                    console.log('❌ لم يتم تطبيق الخصم:', {
                        medicineIdMatch,
                        hasBuyQuantity: !!discount.buy_quantity,
                        hasGetQuantity: !!discount.get_quantity,
                        medicine: medicine.name
                    });
                }
            });
        }
    });
    
    // تطبيق خصومات على الطلب الكامل (إذا كان هناك حد أدنى للطلب)
    validDiscounts.forEach(discount => {
        if (!discount.medicine_id) {
            // خصم على الطلب الكامل
            if (discount.discount_type === 'percentage') {
                if (!discount.min_order_amount || totalAmount >= discount.min_order_amount) {
                    const discountAmount = (totalAmount * discount.percentage / 100);
                    
                    appliedDiscounts.push({
                        type: 'order',
                        discount: discount,
                        amount: discountAmount
                    });
                    
                    totalDiscountAmount += discountAmount;
                }
            } else if (discount.discount_type === 'buy_get') {
                // تطبيق خصم شراء X واحصل على Y على جميع الأدوية (إذا لم يكن هناك medicine_id محدد)
                if (discount.buy_quantity && discount.get_quantity) {
                    // تطبيق الخصم على جميع الأدوية المحددة
                    medicinesWithDiscounts.forEach(medicine => {
                        if (medicine.quantity >= discount.buy_quantity) {
                            const freeQuantity = Math.floor(medicine.quantity / discount.buy_quantity) * discount.get_quantity;
                            
                            // إذا كان للدواء بالفعل freeQuantity، نأخذ الأكبر
                            if (!medicine.freeQuantity || freeQuantity > medicine.freeQuantity) {
                                medicine.freeQuantity = freeQuantity;
                                medicine.originalQuantity = medicine.quantity;
                                medicine.totalQuantity = medicine.quantity + freeQuantity;
                                medicine.appliedDiscount = discount;
                                
                                console.log('✅ تطبيق خصم buy_get عام على:', {
                                    medicine: medicine.name,
                                    quantity: medicine.quantity,
                                    freeQuantity: freeQuantity,
                                    totalQuantity: medicine.totalQuantity
                                });
                            }
                        }
                    });
                    
                    // إضافة الخصم إلى appliedDiscounts
                    appliedDiscounts.push({
                        type: 'buy_get',
                        discount: discount,
                        description: `شراء ${discount.buy_quantity} واحصل على ${discount.get_quantity} مجاناً (على جميع الأدوية)`,
                        isGeneral: true // علامة أن الخصم عام
                    });
                }
            }
        }
    });
    
    // حساب المبلغ النهائي بعد الخصومات
    const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);
    
    console.log('🔍 medicinesWithDiscounts بعد التطبيق:', JSON.parse(JSON.stringify(medicinesWithDiscounts)));
    console.log('🔍 appliedDiscounts:', JSON.parse(JSON.stringify(appliedDiscounts)));
    
    // التأكد من أن freeQuantity موجودة في medicinesWithDiscounts
    medicinesWithDiscounts.forEach(med => {
        const buyGetDiscount = appliedDiscounts.find(d => 
            d.type === 'buy_get' && 
            (d.medicine === med.name || (d.medicineId && (d.medicineId === med.id || String(d.medicineId) === String(med.id))))
        );
        if (buyGetDiscount && buyGetDiscount.freeQuantity && !med.freeQuantity) {
            console.log('⚠️ إضافة freeQuantity المفقودة للدواء:', med.name);
            med.freeQuantity = buyGetDiscount.freeQuantity;
            med.originalQuantity = med.quantity;
            med.totalQuantity = med.quantity + buyGetDiscount.freeQuantity;
        }
    });
    
    return {
        appliedDiscounts: appliedDiscounts,
        totalDiscount: totalDiscountAmount,
        finalAmount: finalAmount,
        originalAmount: totalAmount,
        medicinesWithDiscounts: medicinesWithDiscounts
    };
}

/**
 * تطبيق خصم شراء X واحصل على Y
 */
function applyBuyGetDiscount(selectedMedicines, discount) {
    if (!discount.buy_quantity || !discount.get_quantity) return selectedMedicines;
    
    // إذا كان الخصم خاص بدواء معين
    if (discount.medicine_id) {
        const medicine = selectedMedicines.find(m => m.id === discount.medicine_id);
        if (medicine && medicine.quantity >= discount.buy_quantity) {
            const freeQuantity = Math.floor(medicine.quantity / discount.buy_quantity) * discount.get_quantity;
            medicine.freeQuantity = freeQuantity;
            medicine.discountDescription = `خصم: شراء ${discount.buy_quantity} واحصل على ${discount.get_quantity} مجاناً`;
        }
    }
    
    return selectedMedicines;
}

/**
 * جلب الخصومات الخاصة بشركة معينة
 */
async function getCompanyDiscounts(companyId) {
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        const { data, error } = await client
            .from('company_discounts')
            .select('*')
            .eq('company_user_id', companyId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // تصفية الخصومات الصالحة فقط
        return data.filter(isDiscountValid);
    } catch (error) {
        console.error('❌ خطأ في جلب الخصومات:', error.message);
        return [];
    }
}

// جعل الدوال متاحة عالمياً
window.applyDiscounts = applyDiscounts;
window.getCompanyDiscounts = getCompanyDiscounts;
window.isDiscountValid = isDiscountValid;
window.applyBuyGetDiscount = applyBuyGetDiscount;

