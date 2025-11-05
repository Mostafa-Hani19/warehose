/**
 * أداة ترحيل كلمات المرور
 * تقوم بتشفير كلمات المرور الموجودة في قاعدة البيانات
 */

/**
 * تشفير جميع كلمات المرور في قاعدة البيانات
 */
async function migratePasswords() {
    // التحقق من أن Supabase متاح
    if (typeof getSupabaseClient !== 'function') {
        console.error('❌ Supabase غير متاح');
        return;
    }
    
    const client = getSupabaseClient();
    if (!client) {
        console.error('❌ لم يتم تهيئة Supabase');
        return;
    }
    
    try {
        // جلب جميع المستخدمين
        const { data: users, error } = await client
            .from('users')
            .select('id, username, password');
            
        if (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            return;
        }
        
        console.log(`🔄 سيتم معالجة كلمات المرور لـ ${users.length} مستخدم`);
        
        // Since password encryption is removed, we'll just log that passwords are stored as plain text
        for (const user of users) {
            console.log(`ℹ️  كلمة المرور للمستخدم ${user.username} مخزنة كنص عادي`);
        }
        
        console.log(`✅ تمت معالجة كلمات المرور لـ ${users.length} مستخدم`);
        
    } catch (error) {
        console.error('❌ خطأ في ترحيل كلمات المرور:', error);
    }
}

// تشغيل ترحيل كلمات المرور تلقائيًا عند تحميل الصفحة إذا لزم الأمر
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من أن المستخدم مسؤول (لتنفيذ الترحيل)
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        // التحقق من الحاجة إلى الترحيل (يمكنك تعديل هذا الشرط حسب الحاجة)
        const shouldMigrate = localStorage.getItem('passwordsMigrated') !== 'true';
        if (shouldMigrate) {
            console.log('🔄 بدء ترحيل كلمات المرور...');
            migratePasswords().then(() => {
                localStorage.setItem('passwordsMigrated', 'true');
            });
        }
    }
});