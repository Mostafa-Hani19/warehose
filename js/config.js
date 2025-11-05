/**
 * إعدادات Supabase
 * ملف التكوين للاتصال بقاعدة البيانات
 * 
 * ⚠️ تحذير: في الإنتاج، يجب استخدام متغيرات البيئة بدلاً من المفاتيح المباشرة
 */

// ==================== إعدادات Supabase ====================
const SUPABASE_CONFIG = {
    // رابط المشروع في Supabase
    URL: window.env?.SUPABASE_URL || 'https://ayagvlhzmhmhvwdfjuxo.supabase.co',
    
    // مفتاح API العام (anon key)
    // في الإنتاج، يجب استخدام متغيرات البيئة
    ANON_KEY: window.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5YWd2bGh6bWhtaHZ3ZGZqdXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODM4MDgsImV4cCI6MjA3NzA1OTgwOH0.86NcNyF4ypGlY_a1AMCQPGaMjU38FWoz-L_q8M7wC1Y'
};

// ==================== إعدادات الأداء ====================
const PERFORMANCE_CONFIG = {
    // تفعيل التخزين المؤقت للبيانات (بالثواني)
    CACHE_ENABLED: true,
    CACHE_DURATION: 30000, // 30 ثانية
    
    // عدد العناصر في الصفحة الواحدة (Pagination)
    ITEMS_PER_PAGE: 50,
    
    // تفعيل Lazy Loading للصور
    LAZY_LOAD_IMAGES: true
};

// ==================== إعدادات النظام ====================
const SYSTEM_CONFIG = {
    // إصدار النظام
    VERSION: '1.0.0',
    
    // اللغة الافتراضية
    DEFAULT_LANGUAGE: 'ar',
    
    // تفعيل وضع الظلام
    DARK_MODE_ENABLED: false,
    
    // تفعيل الإشعارات
    NOTIFICATIONS_ENABLED: true,
    
    // مدة عرض الإشعارات (بالميلي ثانية)
    NOTIFICATION_DURATION: 3000
};

// ==================== طلب Supabase من CDN ====================
// سيتم تحميل Supabase من CDN في ملفات HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ==================== إنشاء كائن Supabase ====================
// سيتم إنشاء العميل في supabase-integration.js

// ==================== تعرض الإعدادات للاستخدام ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG };
}
