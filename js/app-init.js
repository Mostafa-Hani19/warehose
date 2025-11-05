/**
 * تهيئة التطبيق
 * يحتوي على الكود الخاص بتهيئة التطبيق بعد تحميل الصفحة
 */

// تهيئة Supabase
if (typeof initSupabaseClient === 'function') {
    initSupabaseClient();
}

// التحقق من تسجيل الدخول والموافقة
// فقط إذا لم نكن في صفحة تسجيل الدخول أو التسجيل
const currentPath = window.location.pathname.toLowerCase();
const currentHref = window.location.href.toLowerCase();
const isLoginPage = currentPath.includes('login.html') || currentHref.includes('login.html');
const isRegisterPage = currentPath.includes('register.html') || currentHref.includes('register.html');
const isPendingPage = currentPath.includes('pending-approval.html') || currentHref.includes('pending-approval.html');

if (!isLoginPage && !isRegisterPage && !isPendingPage) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = 'login.html';
        throw new Error('User not logged in'); // إيقاف تنفيذ بقية السكريبت
    }
}

// التحقق من صحة UUID للمستخدم الحالي
const user = getCurrentUser();
if (user && typeof user.id === 'number') {
    console.warn('⚠️ المستخدم الحالي له ID رقمي بدلاً من UUID. سيتم إعادة تسجيل الدخول... ');
    if (typeof clearLocalDataAndRelogin === 'function') {
        clearLocalDataAndRelogin();
    }
    throw new Error('Invalid user ID format');
}

// التحقق من الموافقة على الحساب - يجب أن يحدث قبل أي شيء
if (user && user.is_approved === false) {
    console.log('⚠️ المستخدم غير موافق عليه بعد - التحويل إلى صفحة الانتظار');
    window.location.href = 'pending-approval.html';
    throw new Error('User not approved'); // إيقاف تنفيذ بقية السكريبت
}

// عرض اسم المستخدم بعد التحميل
if (user) {
    // انتظر تحميل DOM
    document.addEventListener('DOMContentLoaded', function() {
        const userNameElement = document.querySelector('.sidebar .flex.items-center .font-medium');
        const userRoleElement = document.querySelector('.sidebar .flex.items-center .text-sm');
        
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        if (userRoleElement) {
            userRoleElement.textContent = user.role === 'warehouse' ? 'مدير المخزن' : user.role === 'admin' ? 'المدير' : user.name;
        }
    });
}

// ملاحظة: التحكم في الشريط الجانبي للشاشات الصغيرة يتم في ملفات ui-responsive.js و navigation.js

// إضافة وظيفة تسجيل الخروج
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🔄 تسجيل الخروج...');
        if (typeof logoutUser === 'function') {
            logoutUser();
        } else {
            localStorage.removeItem('currentUser');
        }
        window.location.href = 'login.html';
    });
    console.log('✅ تم ربط زر تسجيل الخروج');
} else {
    console.error('❌ لم يتم العثور على زر تسجيل الخروج');
}

// مراقبة حالة الموافقة في الوقت الفعلي باستخدام Supabase Realtime
if (user && user.id) {
    const client = getSupabaseClient();
    
    if (client) {
        // الاشتراك في التحديثات الفورية لبيانات المستخدم
        const subscription = client
            .channel(`user-approval-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    console.log('🔔 تم تحديث بيانات المستخدم:', payload);
                    
                    // التحقق من حالة الموافقة
                    if (payload.new && payload.new.is_approved === false) {
                        console.warn('⛔ تم إيقاف حسابك من قبل المسؤول!');
                        
                        // تحديث بيانات المستخدم في localStorage
                        const currentUser = getCurrentUser();
                        if (currentUser) {
                            currentUser.is_approved = false;
                            localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        }
                        
                        // إظهار رسالة للمستخدم
                        alert('تم إيقاف حسابك من قبل الإدارة. سيتم تحويلك إلى صفحة الانتظار.');
                        
                        // إعادة التوجيه فوراً
                        window.location.href = 'pending-approval.html';
                    } else if (payload.new && payload.new.is_approved === true && payload.old.is_approved === false) {
                        console.log('✅ تمت الموافقة على حسابك!');
                        alert('تمت الموافقة على حسابك! يمكنك الآن استخدام النظام.');
                        
                        // تحديث بيانات المستخدم في localStorage
                        const currentUser = getCurrentUser();
                        if (currentUser) {
                            currentUser.is_approved = true;
                            localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ تم الاشتراك في مراقبة حالة الموافقة في الوقت الفعلي');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ خطأ في الاشتراك:', status);
                    // في حالة فشل Realtime، نستخدم الطريقة التقليدية
                    fallbackToPolling();
                }
            });
        
        // تنظيف الاشتراك عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            if (subscription) {
                client.removeChannel(subscription);
            }
        });
    } else {
        fallbackToPolling();
    }
}

// الطريقة الاحتياطية: التحقق الدوري (في حالة فشل Realtime)
function fallbackToPolling() {
    if (!user || !user.id) return;
    
    console.log('⚠️ استخدام الطريقة الاحتياطية: التحقق الدوري كل 15 ثانية');
    
    setInterval(async function() {
        const client = getSupabaseClient();
        if (!client) return;
        
        try {
            const { data, error } = await client
                .from('users')
                .select('is_approved')
                .eq('id', user.id)
                .single();
            
            if (error) {
                console.error('❌ خطأ في التحقق من حالة الموافقة:', error);
                return;
            }
            
            if (data && data.is_approved === false) {
                console.warn('⛔ تم إيقاف حسابك من قبل المسؤول!');
                alert('تم إيقاف حسابك. سيتم تسجيل خروجك الآن.');
                
                const currentUser = getCurrentUser();
                if (currentUser) {
                    currentUser.is_approved = false;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
                
                window.location.href = 'pending-approval.html';
            }
        } catch (err) {
            console.error('❌ خطأ غير متوقع:', err);
        }
    }, 15000); // كل 15 ثانية
}

// وظيفة طي الشريط الجانبي
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    const toggleSidebar = () => {
        const isCollapsed = sidebar.classList.toggle('-translate-x-full'); // For RTL, this should be translate-x-full
        if (document.dir === 'rtl') {
            sidebar.classList.toggle('translate-x-full');
        }
        mainContent.classList.toggle('mr-0');
        mainContent.classList.toggle('mr-64');
        // حفظ الحالة في localStorage
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    };

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // استعادة حالة الشريط الجانبي عند تحميل الصفحة
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        toggleSidebar();
    }
});
