/**
 * ⚙️ تكامل Supabase الكامل للنظام
 * ✅ نسخة نهائية تعمل مع نظام Auth وRLS بدون أخطاء
 */

// ==================== 🔧 تهيئة Supabase ====================

let supabaseClient = null;

/** تهيئة عميل Supabase */
function initSupabaseClient() {
    console.log('🔄 تهيئة Supabase...');

    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase غير محمّل - تأكد من تحميل مكتبة Supabase أولاً');
        return null;
    }

    const { URL, ANON_KEY } = SUPABASE_CONFIG;
    if (!URL || !ANON_KEY) {
        console.error('❌ لم يتم العثور على إعدادات Supabase (URL أو ANON_KEY)');
        return null;
    }

    supabaseClient = supabase.createClient(URL, ANON_KEY);
    console.log('✅ تم إنشاء عميل Supabase بنجاح');
    return supabaseClient;
}

/** الحصول على العميل الحالي أو إنشاؤه */
function getSupabaseClient() {
    return supabaseClient || initSupabaseClient();
}

/** المستخدم الحالي من localStorage */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser')) || null;
    } catch {
        return null;
    }
}

// ==================== 👤 المستخدمين ====================

/** 🔐 تسجيل الدخول */
async function loginUserSupabase(username, password) {
    console.log(`🔄 تسجيل دخول المستخدم: ${username}`);
    const client = getSupabaseClient();

    try {
        // البحث عن المستخدم بالـ username
        const { data: userData, error: userError } = await client
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (userError) throw userError;

        if (!userData) {
            throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        // التحقق من كلمة المرور بدون تشفير
        if (userData.password !== password) {
            throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        // التحقق من أن دور المستخدم هو "warehouse" فقط
        if (userData.role !== 'warehouse') {
            throw new Error('غير مسموح بالدخول - يجب أن يكون دورك مخزن');
        }

        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('✅ تسجيل الدخول ناجح:', userData.username);
        
        // التحقق من حالة الموافقة - لا نرمي خطأ هنا، سيتم التحقق في الصفحة التالية
        if (userData.is_approved === false) {
            console.warn('⚠️ المستخدم غير موافق عليه بعد');
        }
        
        return userData;
    } catch (error) {
        console.error('❌ فشل تسجيل الدخول:', error.message);
        return null;
    }
}

/** 🆕 إنشاء مستخدم جديد */
async function createUserSupabase(userData, warehouseData = null) {
    const client = getSupabaseClient();

    try {
        // إنشاء المستخدم مباشرة في جدول users بدون تشفير كلمة المرور
        const newUserData = {
            username: userData.username,
            password: userData.password, // حفظ كلمة المرور كنص عادي
            role: userData.role || 'warehouse',
            name: userData.name,
            email: userData.email,
            phone: userData.phone || null,
            is_approved: false // المستخدم غير موافق عليه بشكل افتراضي
        };

        // إضافة id فقط إذا تم توفيره (للمستخدم الافتراضي)
        if (userData.id) {
            newUserData.id = userData.id;
            newUserData.is_approved = true; // المستخدم الافتراضي موافق عليه تلقائياً
        }

        const { data, error } = await client.from('users').insert([newUserData]).select().single();
        
        if (error) {
            console.error('❌ خطأ في إنشاء المستخدم:', error);
            throw error;
        }

        console.log('✅ تم إنشاء المستخدم بنجاح:', data.username);
        
        // إذا كان لدينا بيانات المخزن، نضيفها إلى جدول warehouse_users
        if (warehouseData && data.id) {
            const warehouseUserData = {
                user_id: data.id,
                address: warehouseData.address,
                license_number: warehouseData.license_number,
                region: warehouseData.region
            };
            
            const { error: warehouseError } = await client
                .from('warehouse_users')
                .insert([warehouseUserData]);
            
            if (warehouseError) {
                console.error('❌ خطأ في إضافة بيانات المخزن:', warehouseError);
                // لا نرمي خطأ هنا لأن المستخدم تم إنشاؤه بالفعل
            } else {
                console.log('✅ تم إضافة بيانات المخزن بنجاح');
            }
        }

        return data;
    } catch (error) {
        console.error('❌ خطأ في إنشاء المستخدم:', error.message);
        return null;
    }
}

// ==================== 💊 الأدوية ====================

/** 📦 جلب جميع الأدوية */
async function getMedicinesFromSupabase() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return [];

    // التحقق من الـ Cache أولاً
    const cacheKey = window.cacheManager?.createKey('medicines', { userId: user.id });
    if (window.cacheManager && cacheKey) {
        const cached = window.cacheManager.get(cacheKey);
        if (cached) {
            console.log('📦 استخدام البيانات من الـ Cache');
            return cached;
        }
    }

    try {
        const { data, error } = await client
            .from('medicines')
            .select(`
                *,
                companies ( name )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        console.log(`✅ تم جلب ${data.length} دواء`);
        
        // حفظ البيانات في الـ Cache
        if (window.cacheManager && cacheKey) {
            window.cacheManager.set(cacheKey, data, 30000); // 30 ثانية
        }
        
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب الأدوية:', error.message);
        return [];
    }
}

/** ➕ إضافة دواء جديد */
async function addMedicineToSupabase(medicineData) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) {
        console.error('❌ لا يوجد مستخدم حالي.');
        return null;
    }

    try {
        // التحقق من صحة البيانات
        if (!medicineData.name || medicineData.name.trim() === '') {
            throw new Error('اسم الدواء مطلوب');
        }
        if (medicineData.quantity < 0) {
            throw new Error('الكمية يجب أن تكون أكبر من أو تساوي صفر');
        }
        if (medicineData.price < 0) {
            throw new Error('السعر يجب أن يكون أكبر من أو يساوي صفر');
        }

        // تحقق من وجود الشركة (اختياري)
        const { data: company } = await client
            .from('companies')
            .select('id')
            .eq('name', medicineData.company)
            .eq('user_id', user.id)
            .maybeSingle();

        const dataToInsert = {
            name: medicineData.name.trim(),
            english_name: medicineData.englishName?.trim() || null,
            quantity: medicineData.quantity,
            price: medicineData.price,
            expiry_date: medicineData.expiryDate,
            category: medicineData.category || 'غير مصنف',
            notes: medicineData.notes?.trim() || '',
            user_id: user.id,
            company_id: company?.id || null,
            international_barcode: medicineData.barcode?.trim() || null,
            strip_quantity: medicineData.stripQuantity || 0,
            discount_percentage: medicineData.discountPercentage || 0
        };

        const { data, error } = await client.from('medicines').insert([dataToInsert]).select().single();
        if (error) throw error;

        console.log('✅ تم إضافة الدواء:', data.name);
        
        // مسح الـ Cache للأدوية
        const cacheKey = window.cacheManager?.createKey('medicines', { userId: user.id });
        if (window.cacheManager && cacheKey) {
            window.cacheManager.delete(cacheKey);
        }
        
        return data;
    } catch (error) {
        console.error('❌ خطأ في إضافة الدواء:', error.message);
        throw error; // إعادة رمي الخطأ للتعامل معه في الواجهة
    }
}

/** ✏️ تحديث دواء */
async function updateMedicineInSupabase(id, medicineData) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return null;

    try {
        // البحث عن company_id بناءً على اسم الشركة الشركة
        let companyId = null;
        if (medicineData.company) {
            const { data: company } = await client
                .from('companies')
                .select('id')
                .eq('name', medicineData.company)
                .eq('user_id', user.id)
                .maybeSingle();
            companyId = company?.id || null;
        }

        const { data, error } = await client
            .from('medicines')
            .update({
                name: medicineData.name,
                english_name: medicineData.englishName || null,
                quantity: medicineData.quantity,
                price: medicineData.price,
                expiry_date: medicineData.expiryDate, // اسم العمود في قاعدة البيانات
                category: medicineData.category || 'غير مصنف',
                notes: medicineData.notes,
                company_id: companyId,
                international_barcode: medicineData.barcode || null,
                strip_quantity: medicineData.stripQuantity || 0,
                discount_percentage: medicineData.discountPercentage || 0
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ تم تحديث الدواء:', data.name);
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحديث الدواء:', error.message);
        return null;
    }
}

/** 🗑️ حذف دواء */
async function deleteMedicineFromSupabase(id) {
    const client = getSupabaseClient();

    try {
        const { error } = await client.from('medicines').delete().eq('id', id);
        if (error) throw error;
        console.log('🗑️ تم حذف الدواء');
        return true;
    } catch (error) {
        console.error('❌ خطأ في حذف الدواء:', error.message);
        return false;
    }
}

// ==================== 📦 الطلبات ====================

/** 📦 جلب الطلبات */
async function getOrdersFromSupabase() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const { data, error } = await client
            .from('orders')
            .select(`
                *,
                order_items (*),
                companies_users (
                    id,
                    company_name,
                    users (
                        id,
                        name,
                        email
                    )
                ),
                warehouse_users (
                    id,
                    users (
                        id,
                        name,
                        email
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب الطلبات:', error.message);
        return [];
    }
}

/** 📦 جلب الطلبات الواردة (للطلبات المرسلة إلى هذا المخزن أو الشركة) */
async function getIncomingOrdersFromSupabase() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return [];

    try {
        // أولاً: جلب معرف warehouse_users أو companies_users للمستخدم الحالي
        let warehouseUserId = null;
        let companyUserId = null;
        
        // البحث في warehouse_users
        const { data: warehouseData, error: warehouseError } = await client
            .from('warehouse_users')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (!warehouseError && warehouseData) {
            warehouseUserId = warehouseData.id;
        }
        
        // البحث في companies_users
        const { data: companyData, error: companyError } = await client
            .from('companies_users')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (!companyError && companyData) {
            companyUserId = companyData.id;
        }
        
        // بناء استعلام البحث
        let query = client
            .from('orders')
            .select(`
                *,
                order_items (*),
                users (
                    id,
                    name,
                    email,
                    role
                )
            `);
        
        // إضافة شروط البحث حسب نوع المستخدم
        if (warehouseUserId && companyUserId) {
            // إذا كان المستخدم له كلا المعرفين (مخزن وشركة)
            query = query.or(`warehouse_id.eq.${warehouseUserId},company_id.eq.${companyUserId}`);
        } else if (warehouseUserId) {
            // إذا كان المستخدم مخزن فقط
            query = query.eq('warehouse_id', warehouseUserId);
        } else if (companyUserId) {
            // إذا كان المستخدم شركة فقط
            query = query.eq('company_id', companyUserId);
        } else {
            // إذا لم يكن له أي معرف، لا توجد طلبات واردة
            console.log('⚠️ المستخدم ليس له معرف في warehouse_users أو companies_users');
            return [];
        }
        
        console.log('🔍 البحث عن الطلبات:', {
            warehouseUserId,
            companyUserId,
            userRole: user.role
        });
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ تم جلب ${data.length} طلب وارد`);
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب الطلبات الواردة:', error.message);
        return [];
    }
}

/** ➕ إضافة طلب جديد */
async function addOrderToSupabase(orderData, orderItems) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) {
        console.error('❌ لا يوجد مستخدم حالي.');
        return null;
    }

    try {
        // التحقق من وجود معرف الشركة
        if (!orderData.companyId) {
            throw new Error('معرف الشركة مطلوب لإنشاء الطلب');
        }

        console.log('🔄 جاري إنشاء الطلب:', {
            userId: user.id,
            companyId: orderData.companyId,
            itemsCount: orderItems.length
        });

        // إنشاء رقم طلب بسيط وواضح مثل: ORD-17622793
        const timestamp = Date.now().toString();
        const orderNumber = `ORD-${timestamp.slice(-8)}`;
        
        // حساب المبلغ الإجمالي
        const originalAmount = orderItems.reduce((sum, item) => sum + (item.unit_price * (item.original_quantity || item.quantity)), 0);
        
        // استخدام المبلغ النهائي بعد الخصومات والرصيد إذا كان متوفراً
        const finalAmount = orderData.finalAmount !== undefined ? orderData.finalAmount : originalAmount;
        
        // تحديد نوع المورد (شركة أو مخزن)
        const supplierType = orderData.supplierType || 'company';
        
        // حساب خصم الرصيد
        const creditDeductionFromBalance = orderData.creditDeductionFromBalance || 0;
        
        // بناء بيانات الطلب حسب نوع المورد
        const dataToInsert = {
            order_number: orderNumber,
            user_id: user.id, // المستخدم الحالي (المخزن الذي يطلب)
            total_amount: orderData.originalAmount || originalAmount, // المبلغ الأصلي قبل الخصومات
            credit_deduction: (orderData.totalDiscount || 0) + creditDeductionFromBalance, // قيمة الخصومات + خصم الرصيد
            final_amount: finalAmount, // المبلغ النهائي بعد خصم الرصيد
            status: 'pending',
            payment_method: orderData.paymentMethod || null,
            supplier_type: supplierType // نوع المورد: 'company' أو 'warehouse'
        };
        
        // إضافة المعرف حسب نوع المورد
        if (supplierType === 'warehouse') {
            // إذا كان المورد مخزن، نستخدم warehouse_id
            dataToInsert.warehouse_id = orderData.companyId; // هذا هو warehouse_users.id
            dataToInsert.company_id = null; // null للمخازن
        } else {
            // إذا كان المورد شركة، نستخدم company_id
            dataToInsert.company_id = orderData.companyId; // هذا هو companies_users.id
            dataToInsert.warehouse_id = null; // null للشركات
        }

        console.log('📦 بيانات الطلب المراد إرسالها:', dataToInsert);

        // إضافة الطلب
        const { data: order, error: orderError } = await client
            .from('orders')
            .insert([dataToInsert])
            .select()
            .single();

        if (orderError) {
            console.error('❌ خطأ في إضافة الطلب:', orderError);
            throw orderError;
        }

        console.log('✅ تم إنشاء الطلب بنجاح:', order.order_number);

        // خصم الرصيد إذا كان هناك مبلغ محدد
        if (orderData.creditDeductionFromBalance && orderData.creditDeductionFromBalance > 0) {
            const user = getCurrentUser();
            if (user) {
                try {
                    await deductCreditFromUserCompany(user.id, orderData.companyId, orderData.creditDeductionFromBalance);
                    console.log(`✅ تم خصم ${orderData.creditDeductionFromBalance} من الرصيد`);
                } catch (creditError) {
                    console.error('❌ خطأ في خصم الرصيد:', creditError);
                    // لا نوقف العملية، فقط نسجل الخطأ
                }
            }
        }

        // إضافة تفاصيل الطلب
        const itemsToInsert = orderItems.map(item => ({
            order_id: order.id,
            medicine_name: item.medicine_name,
            quantity: item.quantity || item.original_quantity || 1, // استخدام الكمية المحدثة (مع الكمية المجانية)
            price: item.unit_price,
            total_price: item.total_price || (item.unit_price * (item.quantity || 1)), // استخدام السعر بعد الخصم
            batch_number: item.free_quantity ? `free_quantity:${item.free_quantity}:original_quantity:${item.original_quantity || item.quantity - item.free_quantity}` : null // حفظ الكمية المجانية والكمية الأصلية
        }));

        console.log('📋 تفاصيل الطلب المراد إضافتها:', itemsToInsert);
        console.log('📋 بيانات الكمية المجانية والخصومات:', orderItems.map(item => ({
            name: item.medicine_name,
            quantity: item.quantity,
            free_quantity: item.free_quantity,
            original_quantity: item.original_quantity,
            total_price: item.total_price,
            discount_amount: item.discount_amount
        })));

        const { error: itemsError } = await client
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('❌ خطأ في إضافة تفاصيل الطلب:', itemsError);
            throw itemsError;
        }

        console.log('✅ تم إضافة تفاصيل الطلب بنجاح');
        console.log('📤 تم إرسال الطلب للشركة:', orderData.companyId);

        // مسح الـ Cache للطلبات
        const cacheKey = window.cacheManager?.createKey('orders', { userId: user.id });
        if (window.cacheManager && cacheKey) {
            window.cacheManager.delete(cacheKey);
        }

        return order;
    } catch (error) {
        console.error('❌ خطأ في إضافة الطلب:', error.message);
        console.error('ℹ️ تفاصيل الخطأ:', error);
        throw error; // إعادة رمي الخطأ للتعامل معه في الواجهة
    }
}

/** ✏️ تحديث حالة الطلب */
async function updateOrderStatusInSupabase(orderId, status) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return null;

    try {
        // للطلبات الواردة، نحتاج للتحقق من warehouse_id أو company_id
        // أولاً: جلب معرف warehouse_users أو companies_users للمستخدم الحالي
        let warehouseUserId = null;
        let companyUserId = null;
        
        // البحث في warehouse_users
        const { data: warehouseData, error: warehouseError } = await client
            .from('warehouse_users')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (!warehouseError && warehouseData) {
            warehouseUserId = warehouseData.id;
        }
        
        // البحث في companies_users
        const { data: companyData, error: companyError } = await client
            .from('companies_users')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (!companyError && companyData) {
            companyUserId = companyData.id;
        }
        
        // بناء استعلام التحديث
        let query = client
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        
        // إضافة شروط التحقق حسب نوع المستخدم
        if (warehouseUserId && companyUserId) {
            // إذا كان المستخدم له كلا المعرفين
            query = query.or(`user_id.eq.${user.id},warehouse_id.eq.${warehouseUserId},company_id.eq.${companyUserId}`);
        } else if (warehouseUserId) {
            // إذا كان المستخدم مخزن فقط
            query = query.or(`user_id.eq.${user.id},warehouse_id.eq.${warehouseUserId}`);
        } else if (companyUserId) {
            // إذا كان المستخدم شركة فقط
            query = query.or(`user_id.eq.${user.id},company_id.eq.${companyUserId}`);
        } else {
            // إذا لم يكن له أي معرف، فقط user_id
            query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query.select().single();

        if (error) throw error;
        console.log('✅ تم تحديث حالة الطلب:', data.order_number);
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error.message);
        return null;
    }
}

/** ✏️ تحديث طريقة الدفع للطلب */
async function updateOrderPaymentMethodInSupabase(orderId, paymentMethod) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return null;

    try {
        const { data, error } = await client
            .from('orders')
            .update({ payment_method: paymentMethod })
            .eq('id', orderId)
            .or(`user_id.eq.${user.id},company_id.eq.${user.id}`) // يمكن تحديث الطلب من قبل المستخدم أو الشركة
            .select()
            .single();

        if (error) throw error;
        console.log('✅ تم تحديث طريقة الدفع للطلب:', data.order_number);
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحديث طريقة الدفع للطلب:', error.message);
        return null;
    }
}

/** ✏️ تحديث حالة طلب الاسترجاع وإضافة المبلغ إلى الرصيد */
async function updateReturnStatusInSupabase(returnId, status, approvalMessage = null, refundAmount = null) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return null;

    try {
        // جلب بيانات الاسترجاع أولاً
        const { data: returnData, error: fetchError } = await client
            .from('returns')
            .select('*')
            .eq('id', returnId)
            .single();

        if (fetchError) throw fetchError;

        // تحديث حالة الاسترجاع
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };

        if (status === 'approved') {
            updateData.approved_at = new Date().toISOString();
            if (approvalMessage) {
                updateData.approval_message = approvalMessage;
            }
            // استخدام refund_amount إذا كان محدداً، وإلا استخدام total_return_value
            const refundValue = refundAmount || returnData.refund_amount || returnData.total_return_value || 0;
            if (refundValue > 0) {
                updateData.refund_amount = refundValue;
            }
        } else if (status === 'rejected') {
            updateData.rejected_at = new Date().toISOString();
            if (approvalMessage) {
                updateData.approval_message = approvalMessage;
            }
        }

        const { data: updatedReturn, error: updateError } = await client
            .from('returns')
            .update(updateData)
            .eq('id', returnId)
            .select()
            .single();

        if (updateError) throw updateError;

        // إذا تم قبول الاسترجاع وكان هناك مبلغ استرداد، نضيفه إلى الرصيد
        if (status === 'approved') {
            const refundValue = refundAmount || updatedReturn.refund_amount || updatedReturn.total_return_value || 0;
            
            if (refundValue > 0) {
                // التحقق من نوع التعويض - إذا كان invoice_deduction، نضيف للرصيد
                const compensationType = updatedReturn.compensation_type || 'invoice_deduction';
                
                if (compensationType === 'invoice_deduction') {
                    await addCreditToUserCompany(returnData.requester_id, returnData.company_id, refundValue);
                    console.log(`✅ تم إضافة ${refundValue} إلى رصيد المستخدم`);
                }
            }
        }

        console.log('✅ تم تحديث حالة طلب الاسترجاع:', returnId);
        return updatedReturn;
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة طلب الاسترجاع:', error.message);
        return null;
    }
}

/** ✏️ إضافة رصيد للمستخدم من شركة معينة */
async function addCreditToUserCompany(userId, companyId, amount) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        // البحث عن سجل موجود
        const { data: existingCredit, error: fetchError } = await client
            .from('user_company_credits')
            .select('*')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw fetchError;
        }

        if (existingCredit) {
            // تحديث الرصيد الموجود
            const newBalance = parseFloat(existingCredit.credit_balance || 0) + parseFloat(amount);
            const { data, error } = await client
                .from('user_company_credits')
                .update({
                    credit_balance: newBalance,
                    last_updated: new Date().toISOString()
                })
                .eq('id', existingCredit.id)
                .select()
                .single();

        if (error) throw error;
            console.log(`✅ تم تحديث الرصيد: ${existingCredit.credit_balance} + ${amount} = ${newBalance}`);
        return data;
        } else {
            // إنشاء سجل جديد
            const { data, error } = await client
                .from('user_company_credits')
                .insert([{
                    user_id: userId,
                    company_id: companyId,
                    credit_balance: parseFloat(amount),
                    last_updated: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            console.log(`✅ تم إنشاء رصيد جديد: ${amount}`);
            return data;
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة الرصيد:', error.message);
        throw error;
    }
}

/** ✏️ جلب رصيد المستخدم من شركة معينة */
async function getUserCompanyCredit(userId, companyId) {
    const client = getSupabaseClient();
    if (!client) return 0;

    try {
        const { data, error } = await client
            .from('user_company_credits')
            .select('credit_balance')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        
        return parseFloat(data?.credit_balance || 0);
    } catch (error) {
        console.error('❌ خطأ في جلب الرصيد:', error.message);
        return 0;
    }
}

/** ✏️ خصم مبلغ من رصيد المستخدم من شركة معينة */
async function deductCreditFromUserCompany(userId, companyId, amount) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        // البحث عن سجل موجود
        const { data: existingCredit, error: fetchError } = await client
            .from('user_company_credits')
            .select('*')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        const deductAmount = parseFloat(amount);
        if (deductAmount <= 0) {
            throw new Error('المبلغ يجب أن يكون أكبر من صفر');
        }

        if (existingCredit) {
            const currentBalance = parseFloat(existingCredit.credit_balance || 0);
            if (deductAmount > currentBalance) {
                throw new Error(`المبلغ المطلوب خصمه (${deductAmount}) أكبر من الرصيد المتاح (${currentBalance})`);
            }

            const newBalance = currentBalance - deductAmount;
            const { data, error } = await client
                .from('user_company_credits')
                .update({
                    credit_balance: newBalance,
                    last_updated: new Date().toISOString()
                })
                .eq('id', existingCredit.id)
                .select()
                .single();

        if (error) throw error;
            console.log(`✅ تم خصم الرصيد: ${currentBalance} - ${deductAmount} = ${newBalance}`);
        return data;
        } else {
            throw new Error('لا يوجد رصيد متاح للخصم');
        }
    } catch (error) {
        console.error('❌ خطأ في خصم الرصيد:', error.message);
        throw error;
    }
}

/** ✏️ جلب جميع أرصدة المستخدم */
async function getAllUserCredits(userId) {
    const client = getSupabaseClient();
    if (!client) return [];

    try {
        const { data, error } = await client
            .from('user_company_credits')
            .select(`
                *,
                company:companies_users!user_company_credits_company_id_fkey (
                    id,
                    company_name,
                    users!inner (id, name, email)
                )
            `)
            .eq('user_id', userId)
            .gt('credit_balance', 0)
            .order('last_updated', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب الأرصدة:', error.message);
        return [];
    }
}

/** ✏️ تحديث الطلب (الأدوية والكميات) */
async function updateOrderInSupabase(orderId, orderData, orderItems) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) {
        console.error('❌ لا يوجد مستخدم حالي.');
        return null;
    }

    try {
        console.log('🔄 جاري تحديث الطلب:', orderId);

        // حساب المبلغ الإجمالي
        const originalAmount = orderItems.reduce((sum, item) => sum + (item.unit_price * (item.original_quantity || item.quantity)), 0);
        const finalAmount = orderData.finalAmount !== undefined ? orderData.finalAmount : originalAmount;

        // تحديد نوع المورد (شركة أو مخزن)
        const supplierType = orderData.supplierType || 'company';
        
        // بناء بيانات التحديث
        const updateData = {
            total_amount: orderData.originalAmount || originalAmount,
            credit_deduction: orderData.totalDiscount || 0,
            final_amount: finalAmount,
            payment_method: orderData.paymentMethod || null,
            updated_at: new Date().toISOString(),
            supplier_type: supplierType
        };
        
        // إضافة المعرف حسب نوع المورد
        if (supplierType === 'warehouse') {
            updateData.warehouse_id = orderData.companyId;
            updateData.company_id = null;
        } else {
            updateData.company_id = orderData.companyId;
            updateData.warehouse_id = null;
        }
        
        // تحديث بيانات الطلب
        const { data: updatedOrder, error: orderError } = await client
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .eq('user_id', user.id) // التأكد من أن المستخدم هو صاحب الطلب
            .select()
            .single();

        if (orderError) {
            console.error('❌ خطأ في تحديث الطلب:', orderError);
            throw orderError;
        }

        console.log('✅ تم تحديث الطلب بنجاح');

        // حذف جميع order_items القديمة
        const { error: deleteError } = await client
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        if (deleteError) {
            console.error('❌ خطأ في حذف تفاصيل الطلب القديمة:', deleteError);
            throw deleteError;
        }

        // إضافة order_items الجديدة
        const itemsToInsert = orderItems.map(item => ({
            order_id: orderId,
            medicine_name: item.medicine_name,
            quantity: item.quantity || item.original_quantity || 1,
            price: item.unit_price,
            total_price: item.total_price || (item.unit_price * (item.quantity || 1)),
            batch_number: item.free_quantity ? `free_quantity:${item.free_quantity}:original_quantity:${item.original_quantity || item.quantity - item.free_quantity}` : null
        }));

        const { error: itemsError } = await client
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('❌ خطأ في إضافة تفاصيل الطلب المحدثة:', itemsError);
            throw itemsError;
        }

        console.log('✅ تم تحديث تفاصيل الطلب بنجاح');

        // مسح الـ Cache
        const cacheKey = window.cacheManager?.createKey('orders', { userId: user.id });
        if (window.cacheManager && cacheKey) {
            window.cacheManager.delete(cacheKey);
        }

        return updatedOrder;
    } catch (error) {
        console.error('❌ خطأ في تحديث الطلب:', error.message);
        throw error;
    }
}


/** ✏️ تحديث شركة */
async function updateCompanyInSupabase(id, companyData) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return null;

    try {
        const { data, error } = await client
            .from('companies')
            .update(companyData)
            .eq('id', id)
            .eq('user_id', user.id)  // التحقق من أن الشركة تنتمي للمستخدم الحالي
            .select()
            .single();

        if (error) throw error;
        console.log('✅ تم تحديث الشركة:', data.name);
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحديث الشركة:', error.message);
        return null;
    }
}

/** 🗑️ حذف شركة */
async function deleteCompanyFromSupabase(id) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const { error } = await client
            .from('companies')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);  // التحقق من أن الشركة تنتمي للمستخدم الحالي

        if (error) throw error;
        console.log('🗑️ تم حذف الشركة');
        return true;
    } catch (error) {
        console.error('❌ خطأ في حذف الشركة:', error.message);
        return false;
    }
}

/** 📦 جلب الشركات */
async function getCompaniesFromSupabase() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) {
        console.log('❌ لا يوجد مستخدم حالي لجلب الشركات');
        return [];
    }

    // التحقق من الـ Cache أولاً
    const cacheKey = window.cacheManager?.createKey('companies', { userId: user.id });
    if (window.cacheManager && cacheKey) {
        const cached = window.cacheManager.get(cacheKey);
        if (cached) {
            console.log('📦 استخدام البيانات من الـ Cache');
            return cached;
        }
    }

    console.log('🔄 جاري جلب الشركات للمستخدم:', user.id);
    
    try {
        // التحقق من صحة بيانات المستخدم
        if (!user.id) {
            console.error('❌ معرف المستخدم غير متوفر');
            return [];
        }

        // التحقق من أن user_id هو UUID صالح
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.id)) {
            console.error('❌ معرف المستخدم غير صالح كـ UUID:', user.id);
            return [];
        }
        
        const { data, error } = await client
            .from('companies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ خطأ في جلب الشركات:', error.message);
            console.error('ℹ️ تفاصيل الخطأ:', error);
            
            // تسجيل معلومات إضافية للمساعدة في التشخيص
            console.log('ℹ️ معلومات التصحيح:');
            console.log('- بيانات المستخدم:', user);
            console.log('- نوع user.id:', typeof user.id);
            console.log('- طول user.id:', user.id ? user.id.length : 'undefined');
            
            // في حالة وجود مشكلة في RLS
            if (error.message.includes('row-level security policy') || 
                error.message.includes('not authorized') ||
                error.message.includes('permission denied')) {
                console.warn('⚠️ تم اكتشاف مشكلة في سياسة الأمان (RLS)');
                console.warn('⚠️ الحل المقترح:');
                console.warn('  1. قم بتسجيل الدخول إلى Supabase Dashboard');
                console.warn('  2. اذهب إلى Table Editor > companies > RLS');
                console.warn('  3. عطّل RLS مؤقتاً للتجربة أو أضف السياسات التالية:');
                console.warn('     CREATE POLICY "Companies select policy" ON companies FOR SELECT USING (user_id = auth.uid());');
                console.warn('  4. أو قم بتنفيذ الاستعلام التالي في SQL Editor:');
                console.warn('     ALTER TABLE companies DISABLE ROW LEVEL SECURITY;');
            }
            
            throw error;
        }
        
        console.log(`✅ تم جلب ${data.length} شركة`);
        if (data.length > 0) {
            console.log('ℹ️ أول شركة في القائمة:', data[0]);
        }
        
        // حفظ البيانات في الـ Cache
        if (window.cacheManager && cacheKey) {
            window.cacheManager.set(cacheKey, data, 30000); // 30 ثانية
        }
        
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب الشركات:', error.message);
        return [];
    }
}

/** ➕ إضافة شركة */
async function addCompanyToSupabase(companyData) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user) {
        console.error('❌ لا يوجد مستخدم حالي.');
        return null;
    }

    console.log('🔄 جاري إضافة شركة:', companyData, 'للمستخدم:', user.id);

    // التحقق من صحة البيانات
    if (!companyData.name || companyData.name.trim() === '') {
        throw new Error('اسم الشركة مطلوب');
    }

    // التحقق من صحة البريد الإلكتروني إذا كان موجوداً
    if (companyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
        throw new Error('البريد الإلكتروني غير صحيح');
    }

    // تأكد من أن companyData يحتوي فقط على الحقول المطلوبة
    const dataToInsert = {
        name: companyData.name.trim(),
        email: companyData.email?.trim() || null,
        phone: companyData.phone?.trim() || null,
        address: companyData.address?.trim() || null,
        user_id: user.id
    };

    try {
        // التحقق من صحة بيانات المستخدم
        if (!user.id) {
            console.error('❌ معرف المستخدم غير متوفر');
            return null;
        }

        // التحقق من أن user_id هو UUID صالح
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.id)) {
            console.error('❌ معرف المستخدم غير صالح كـ UUID:', user.id);
            return null;
        }

        console.log('ℹ️ محاولة إدراج البيانات:', dataToInsert);

        const { data, error } = await client.from('companies').insert([dataToInsert]).select().single();
        
        if (error) {
            console.error('❌ خطأ في إضافة الشركة:', error.message);
            console.error('ℹ️ تفاصيل الخطأ:', error);
            
            // تسجيل معلومات إضافية للمساعدة في التشخيص
            console.log('ℹ️ معلومات التصحيح:');
            console.log('- بيانات المستخدم:', user);
            console.log('- بيانات الإدراج:', dataToInsert);
            console.log('- نوع user.id:', typeof user.id);
            console.log('- طول user.id:', user.id ? user.id.length : 'undefined');
            
            // في حالة وجود مشكلة في RLS
            if (error.message.includes('row-level security policy') || 
                error.message.includes('not authorized') ||
                error.message.includes('permission denied')) {
                console.warn('⚠️ تم اكتشاف مشكلة في سياسة الأمان (RLS)');
                console.warn('⚠️ الحل المقترح:');
                console.warn('  1. قم بتسجيل الدخول إلى Supabase Dashboard');
                console.warn('  2. اذهب إلى Table Editor > companies > RLS');
                console.warn('  3. عطّل RLS مؤقتاً للتجربة أو أضف السياسات التالية:');
                console.warn('     CREATE POLICY "Companies insert policy" ON companies FOR INSERT WITH CHECK (user_id = auth.uid());');
                console.warn('     CREATE POLICY "Companies select policy" ON companies FOR SELECT USING (user_id = auth.uid());');
                console.warn('  4. أو قم بتنفيذ الاستعلام التالي في SQL Editor:');
                console.warn('     ALTER TABLE companies DISABLE ROW LEVEL SECURITY;');
            }
            
            throw error;
        }
        
        console.log('✅ تم إضافة الشركة:', data.name);
        
        // مسح الـ Cache للشركات
        const cacheKey = window.cacheManager?.createKey('companies', { userId: user.id });
        if (window.cacheManager && cacheKey) {
            window.cacheManager.delete(cacheKey);
        }
        
        return data;
    } catch (error) {
        console.error('❌ خطأ في إضافة الشركة:', error.message);
        throw error; // إعادة رمي الخطأ للتعامل معه في الواجهة
    }
}

/** 📦 جلب جميع الشركات (المستخدمين ذو الدور company) */
async function getAllCompaniesFromSupabase() {
    const client = getSupabaseClient();
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.log('❌ لا يوجد مستخدم حالي لجلب الشركات');
        return [];
    }

    try {
        // جلب جميع الشركات من جدول companies_users مع معلومات المستخدم والأدوية والخصومات
        const { data, error } = await client
            .from('companies_users')
            .select(`
                *,
                users!inner (id, role, name, email),
                company_medicines (*),
                company_discounts (
                    id,
                    discount_type,
                    name,
                    description,
                    percentage,
                    min_order_amount,
                    buy_quantity,
                    get_quantity,
                    medicine_id,
                    is_active,
                    start_date,
                    end_date
                )
            `)
            .eq('users.role', 'company')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ تم جلب ${data.length} شركة مع الخصومات`);
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب الشركات:', error.message);
        return [];
    }
}

/** 📦 جلب جميع المخازن (المستخدمين ذو الدور warehouse) */
async function getAllWarehousesFromSupabase() {
    const client = getSupabaseClient();
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.log('❌ لا يوجد مستخدم حالي لجلب المخازن');
        return [];
    }

    try {
        // جلب جميع المخازن من جدول warehouse_users مع معلومات المستخدم
        // استبعاد المستخدم الحالي (المخزن الخاص به)
        const { data, error } = await client
            .from('warehouse_users')
            .select(`
                *,
                users!inner (id, role, name, email, phone)
            `)
            .eq('users.role', 'warehouse')
            .neq('users.id', currentUser.id) // استبعاد المستخدم الحالي
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ تم جلب ${data.length} مخزن`);
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب المخازن:', error.message);
        return [];
    }
}

/** 📦 جلب أدوية مخزن معين */
async function getWarehouseMedicinesFromSupabase(warehouseUserId) {
    const client = getSupabaseClient();
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.log('❌ لا يوجد مستخدم حالي');
        return [];
    }

    try {
        const { data, error } = await client
            .from('medicines')
            .select('*')
            .eq('user_id', warehouseUserId)
            .gt('quantity', 0) // فقط الأدوية المتوفرة (كمية أكبر من 0)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ تم جلب ${data.length} دواء من المخزن`);
        return data;
    } catch (error) {
        console.error('❌ خطأ في جلب أدوية المخزن:', error.message);
        return [];
    }
}

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabaseClient,
        getSupabaseClient,
        getCurrentUser,
        loginUserSupabase,
        createUserSupabase,
        getMedicinesFromSupabase,
        addMedicineToSupabase,
        getOrdersFromSupabase,
        getIncomingOrdersFromSupabase,
        updateCompanyInSupabase,
        deleteCompanyFromSupabase,
        updateMedicineInSupabase,
        deleteMedicineFromSupabase,
        getCompaniesFromSupabase,
        addCompanyToSupabase,
        getAllCompaniesFromSupabase,
        addOrderToSupabase,
        updateOrderInSupabase,
        updateOrderStatusInSupabase,
        updateOrderPaymentMethodInSupabase,
        getAllWarehousesFromSupabase,
        getWarehouseMedicinesFromSupabase
    };
}

// جعل الدوال متاحة عالمياً
window.updateOrderInSupabase = updateOrderInSupabase;
