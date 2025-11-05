/**
 * نظام إدارة التخزين المؤقت (Cache)
 * يحسن الأداء عن طريق تقليل طلبات Supabase
 */

// ==================== Cache Storage ====================
const cacheStore = new Map();

/**
 * إعدادات التخزين المؤقت
 */
const CACHE_CONFIG = {
    enabled: true,
    defaultTTL: 30000, // 30 ثانية افتراضياً
    maxSize: 100 // الحد الأقصى لعدد العناصر المخزنة
};

/**
 * بنية بيانات Cache Item
 */
class CacheItem {
    constructor(data, ttl = CACHE_CONFIG.defaultTTL) {
        this.data = data;
        this.expiresAt = Date.now() + ttl;
    }

    /**
     * التحقق من انتهاء صلاحية البيانات
     */
    isExpired() {
        return Date.now() > this.expiresAt;
    }
}

/**
 * إضافة عنصر إلى الـ Cache
 * @param {string} key - المفتاح
 * @param {any} data - البيانات
 * @param {number} ttl - مدة الصلاحية (بالميلي ثانية)
 */
function setCache(key, data, ttl = CACHE_CONFIG.defaultTTL) {
    if (!CACHE_CONFIG.enabled) return;

    // التحقق من الحد الأقصى
    if (cacheStore.size >= CACHE_CONFIG.maxSize) {
        // حذف أقدم عنصر
        const firstKey = cacheStore.keys().next().value;
        cacheStore.delete(firstKey);
    }

    cacheStore.set(key, new CacheItem(data, ttl));
}

/**
 * الحصول على عنصر من الـ Cache
 * @param {string} key - المفتاح
 * @returns {any|null} البيانات أو null إذا لم تكن موجودة أو منتهية الصلاحية
 */
function getCache(key) {
    if (!CACHE_CONFIG.enabled) return null;

    const item = cacheStore.get(key);
    if (!item) return null;

    if (item.isExpired()) {
        cacheStore.delete(key);
        return null;
    }

    return item.data;
}

/**
 * حذف عنصر من الـ Cache
 * @param {string} key - المفتاح
 */
function deleteCache(key) {
    cacheStore.delete(key);
}

/**
 * مسح جميع بيانات الـ Cache
 */
function clearCache() {
    cacheStore.clear();
}

/**
 * الحصول على معلومات الـ Cache
 * @returns {Object} معلومات الـ Cache
 */
function getCacheStats() {
    return {
        size: cacheStore.size,
        maxSize: CACHE_CONFIG.maxSize,
        keys: Array.from(cacheStore.keys())
    };
}

/**
 * إنشاء مفتاح Cache من المعاملات
 * @param {string} prefix - البادئة
 * @param {Object} params - المعاملات
 * @returns {string} المفتاح
 */
function createCacheKey(prefix, params = {}) {
    const paramsStr = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
    return `${prefix}${paramsStr ? '|' + paramsStr : ''}`;
}

// تصدير الوظائف
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setCache,
        getCache,
        deleteCache,
        clearCache,
        getCacheStats,
        createCacheKey
    };
}

// جعل الوظائف متاحة عالمياً
window.cacheManager = {
    set: setCache,
    get: getCache,
    delete: deleteCache,
    clear: clearCache,
    stats: getCacheStats,
    createKey: createCacheKey
};

