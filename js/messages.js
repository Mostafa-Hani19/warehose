/**
 * نظام الرسائل والتواصل
 * يحتوي على وظائف إرسال واستقبال الرسائل
 */

/**
 * إرسال رسالة جديدة
 */
async function sendMessage(messageData) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    
    if (!user) {
        if (typeof showNotification === 'function') {
            showNotification('يجب تسجيل الدخول أولاً', 'error');
        }
        return false;
    }
    
    try {
        // تحديد نوع المستخدم بالعربية
        let userRoleArabic = 'غير محدد';
        if (user.role === 'admin') {
            userRoleArabic = 'إدارة';
        } else if (user.role === 'warehouse') {
            userRoleArabic = 'مخزن';
        } else if (user.role === 'pharmacy') {
            userRoleArabic = 'صيدلية';
        }
        
        const { data, error } = await client
            .from('messages')
            .insert([{
                user_id: user.id,
                user_name: user.name || user.username,
                user_email: user.email || 'غير متوفر',
                user_role: userRoleArabic,
                subject: messageData.subject,
                message_type: messageData.messageType,
                message: messageData.message,
                priority: messageData.priority || 'عادية',
                status: 'جديدة'
            }])
            .select();
        
        if (error) throw error;
        
        console.log('✅ تم إرسال الرسالة بنجاح');
        return data[0];
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error.message);
        throw error;
    }
}

/**
 * جلب رسائل المستخدم الحالي فقط
 */
async function getMyMessages() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    
    if (!user) return [];
    
    try {
        const { data, error } = await client
            .from('messages')
            .select('*')
            .eq('user_id', user.id)  // ✅ فقط رسائل هذا المستخدم
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب الرسائل:', error.message);
        return [];
    }
}

/**
 * جلب جميع الرسائل (للأدمن فقط)
 */
async function getAllMessages() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    
    if (!user || user.role !== 'admin') {
        console.warn('⚠️ هذه الوظيفة للأدمن فقط');
        return [];
    }
    
    try {
        const { data, error} = await client
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب جميع الرسائل:', error.message);
        return [];
    }
}

/**
 * تحديث حالة الرسالة (للأدمن فقط)
 */
async function updateMessageStatus(messageId, status, adminReply = null) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    
    if (!user || user.role !== 'admin') {
        if (typeof showNotification === 'function') {
            showNotification('غير مصرح بهذا الإجراء', 'error');
        }
        return false;
    }
    
    try {
        const updateData = { status, updated_at: new Date().toISOString() };
        if (adminReply) {
            updateData.admin_reply = adminReply;
        }
        
        const { data, error } = await client
            .from('messages')
            .update(updateData)
            .eq('id', messageId)
            .select();
        
        if (error) throw error;
        
        console.log('✅ تم تحديث الرسالة بنجاح');
        return data[0];
    } catch (error) {
        console.error('❌ خطأ في تحديث الرسالة:', error.message);
        throw error;
    }
}

/**
 * عرض رسائل المستخدم (تبقى الرسائل القديمة موجودة)
 */
async function loadMyMessages() {
    const container = document.getElementById('myMessagesContainer');
    const countBadge = document.getElementById('messagesCount');
    if (!container) return;
    
    console.log('🔄 تحميل الرسائل...');
    const messages = await getMyMessages();
    console.log(`✅ تم جلب ${messages.length} رسالة`);
    
    // تحديث عداد الرسائل
    if (countBadge) {
        countBadge.textContent = messages.length;
    }
    
    // امسح المحتوى القديم دائماً
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-5xl mb-3">📨</div>
                <p class="text-sm text-gray-400">لا توجد رسائل سابقة</p>
            </div>
        `;
        return;
    }
    
    messages.forEach(msg => {
        const item = document.createElement('div');
        
        const statusColors = {
            'جديدة': 'bg-blue-50 border-blue-200',
            'قيد المراجعة': 'bg-yellow-50 border-yellow-200',
            'تم الحل': 'bg-green-50 border-green-200',
            'مغلقة': 'bg-gray-50 border-gray-200'
        };
        
        const statusDots = {
            'جديدة': 'bg-blue-500',
            'قيد المراجعة': 'bg-yellow-500',
            'تم الحل': 'bg-green-500',
            'مغلقة': 'bg-gray-400'
        };
        
        const typeIcons = {
            'مشكلة': '🔴',
            'طلب': '📝',
            'استفسار': '❓',
            'اقتراح': '💡'
        };
        
        item.className = `group relative p-3 rounded-xl border-2 ${statusColors[msg.status] || 'bg-gray-50'} cursor-pointer hover:shadow-md transition-all`;
        item.innerHTML = `
            <div class="flex items-start gap-2.5 mb-2">
                <span class="text-lg flex-shrink-0">${typeIcons[msg.message_type]}</span>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">${msg.subject}</p>
                    <p class="text-xs text-gray-500 mt-0.5">${msg.message.substring(0, 40)}${msg.message.length > 40 ? '...' : ''}</p>
                </div>
                <div class="w-2 h-2 ${statusDots[msg.status]} rounded-full flex-shrink-0 mt-1.5"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-400">
                <span>${typeof formatDate === 'function' ? formatDate(msg.created_at) : new Date(msg.created_at).toLocaleDateString('ar-EG')}</span>
                ${msg.admin_reply ? '<span class="text-green-600 font-medium">✅ تم الرد</span>' : ''}
            </div>
        `;
        
        item.onclick = () => showMessageDetails(msg);
        container.appendChild(item);
    });
}

/**
 * عرض تفاصيل الرسالة (بدون بيانات المرسل)
 */
function showMessageDetails(msg) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${msg.subject}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <span class="text-xs text-gray-500">النوع:</span>
                    <span class="text-sm font-medium mr-2">${msg.message_type}</span>
                </div>
                <div>
                    <span class="text-xs text-gray-500">الحالة:</span>
                    <span class="text-sm font-medium mr-2">${msg.status}</span>
                </div>
                <div>
                    <span class="text-xs text-gray-500">الأولوية:</span>
                    <span class="text-sm font-medium mr-2 ${msg.priority === 'عاجلة' ? 'text-red-600' : msg.priority === 'عالية' ? 'text-orange-600' : ''}">${msg.priority}</span>
                </div>
                <div>
                    <span class="text-xs text-gray-500">التاريخ:</span>
                    <span class="text-sm mr-2">${typeof formatDate === 'function' ? formatDate(msg.created_at) : new Date(msg.created_at).toLocaleString('ar-EG')}</span>
                </div>
                ${msg.updated_at && msg.updated_at !== msg.created_at ? `
                    <div>
                        <span class="text-xs text-gray-500">آخر تحديث:</span>
                        <span class="text-sm mr-2">${typeof formatDate === 'function' ? formatDate(msg.updated_at) : new Date(msg.updated_at).toLocaleString('ar-EG')}</span>
                    </div>
                ` : ''}
                <div class="pt-3 border-t">
                    <p class="text-sm font-semibold text-gray-700 mb-2">محتوى الرسالة:</p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">${msg.message}</p>
                </div>
                ${msg.admin_reply ? `
                    <div class="pt-3 border-t bg-blue-50 p-3 rounded">
                        <p class="text-xs font-semibold text-blue-900 mb-2">💬 رد الإدارة:</p>
                        <p class="text-sm text-blue-800 whitespace-pre-wrap">${msg.admin_reply}</p>
                    </div>
                ` : `
                    <div class="pt-3 border-t bg-yellow-50 p-3 rounded text-center">
                        <p class="text-xs text-yellow-700">⏳ في انتظار رد الإدارة...</p>
                    </div>
                `}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * معالج إرسال نموذج التواصل
 */
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const messageData = {
                subject: formData.get('subject'),
                messageType: formData.get('messageType'),
                message: formData.get('message'),
                priority: formData.get('priority')
            };
            
            // إظهار مؤشر التحميل
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري الإرسال...';
            submitBtn.disabled = true;
            
            try {
                await sendMessage(messageData);
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريباً', 'success');
                }
                
                this.reset();
                
                // إعادة تحميل الرسائل لإظهار الرسالة الجديدة
                loadMyMessages();
            } catch (error) {
                if (typeof showNotification === 'function') {
                    showNotification('❌ فشل إرسال الرسالة: ' + error.message, 'error');
                }
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
