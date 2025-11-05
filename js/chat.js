/**
 * نظام الشات - Chat System
 * يتيح التواصل بين المخازن والشركات والصيدليات والأدمن
 */

// متغيرات عامة
let currentConversationId = null;
let currentParticipantId = null;
let currentParticipantType = null;
let conversations = [];
let chatMessages = [];
let chatPollingInterval = null;

/**
 * جلب جميع المحادثات للمستخدم الحالي
 */
async function loadConversations() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!user || !client) return;

    try {
        // جلب جميع المحادثات التي يكون فيها المستخدم مشارك
        const { data, error } = await client
            .from('conversations')
            .select(`
                *,
                participant1:users!conversations_participant1_id_fkey(id, name, role),
                participant2:users!conversations_participant2_id_fkey(id, name, role)
            `)
            .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        // معالجة البيانات لعرض أسماء المشاركين
        conversations = await Promise.all(
            (data || []).map(async (conv) => {
                const isParticipant1 = conv.participant1_id === user.id;
                const otherParticipantId = isParticipant1 ? conv.participant2_id : conv.participant1_id;
                const otherParticipantType = isParticipant1 ? conv.participant2_type : conv.participant1_type;
                
                // جلب اسم المشارك الآخر
                const participantName = await getParticipantName(otherParticipantId, otherParticipantType);
                
                // جلب آخر رسالة
                const lastMessage = await getLastMessage(conv.id);
                
                // جلب عدد الرسائل غير المقروءة
                const unreadCount = await getUnreadMessagesCount(conv.id, user.id);
                
                return {
                    id: conv.id,
                    participantId: otherParticipantId,
                    participantType: otherParticipantType,
                    participantName: participantName,
                    lastMessage: lastMessage,
                    lastMessageAt: conv.last_message_at,
                    unreadCount: unreadCount
                };
            })
        );

        renderConversationsList();
    } catch (error) {
        console.error('❌ خطأ في جلب المحادثات:', error);
        const container = document.getElementById('conversationsList');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>حدث خطأ أثناء تحميل المحادثات</p>
                </div>
            `;
        }
    }
}

/**
 * جلب اسم المشارك حسب نوعه
 */
async function getParticipantName(userId, participantType) {
    const client = getSupabaseClient();
    if (!client) return 'غير محدد';

    try {
        if (participantType === 'warehouse') {
            const { data } = await client
                .from('users')
                .select('name')
                .eq('id', userId)
                .single();
            return data?.name || 'مخزن غير محدد';
        } else if (participantType === 'company') {
            const { data } = await client
                .from('companies_users')
                .select('company_name, users!inner(name)')
                .eq('user_id', userId)
                .maybeSingle();
            return data?.company_name || data?.users?.name || 'شركة غير محددة';
        } else if (participantType === 'pharmacy') {
            const { data } = await client
                .from('users')
                .select('name')
                .eq('id', userId)
                .single();
            return data?.name || 'صيدلية غير محددة';
        } else if (participantType === 'admin') {
            const { data } = await client
                .from('users')
                .select('name')
                .eq('id', userId)
                .eq('role', 'admin')
                .single();
            return data?.name || 'مدير النظام';
        }
        return 'غير محدد';
    } catch (error) {
        console.error('❌ خطأ في جلب اسم المشارك:', error);
        return 'غير محدد';
    }
}

/**
 * جلب آخر رسالة في المحادثة
 */
async function getLastMessage(conversationId) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data } = await client
            .from('chat_messages')
            .select('message_text')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        return data?.message_text || null;
    } catch (error) {
        console.error('❌ خطأ في جلب آخر رسالة:', error);
        return null;
    }
}

/**
 * جلب عدد الرسائل غير المقروءة
 */
async function getUnreadMessagesCount(conversationId, userId) {
    const client = getSupabaseClient();
    if (!client) return 0;

    try {
        const { count } = await client
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId)
            .eq('is_read', false)
            .neq('sender_id', userId);
        
        return count || 0;
    } catch (error) {
        console.error('❌ خطأ في جلب عدد الرسائل غير المقروءة:', error);
        return 0;
    }
}

/**
 * عرض قائمة المحادثات
 */
function renderConversationsList() {
    const container = document.getElementById('conversationsList');
    if (!container) return;

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-comments text-4xl mb-3"></i>
                <p>لا توجد محادثات</p>
            </div>
        `;
        return;
    }

    container.innerHTML = conversations.map(conv => {
        const typeIcon = getParticipantTypeIcon(conv.participantType);
        const typeLabel = getParticipantTypeLabel(conv.participantType);
        const unreadBadge = conv.unreadCount > 0 ? `
            <span class="absolute top-2 left-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                ${conv.unreadCount}
            </span>
        ` : '';

        return `
            <div class="p-4 border-b border-gray-200 hover:bg-white cursor-pointer transition-colors conversation-item ${currentConversationId === conv.id ? 'bg-blue-50' : ''}" 
                 onclick="openConversation('${conv.id}', '${conv.participantId}', '${conv.participantType}', '${conv.participantName.replace(/'/g, "\\'")}')">
                <div class="flex items-center gap-3 relative">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="${typeIcon} text-blue-600"></i>
                    </div>
                    ${unreadBadge}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-gray-900 truncate">${conv.participantName}</h4>
                            <span class="text-xs text-gray-500">${formatChatDate(conv.lastMessageAt)}</span>
                        </div>
                        <p class="text-sm text-gray-600 truncate">${conv.lastMessage || 'لا توجد رسائل'}</p>
                        <p class="text-xs text-gray-500 mt-1">${typeLabel}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * الحصول على أيقونة نوع المشارك
 */
function getParticipantTypeIcon(type) {
    const icons = {
        'warehouse': 'fas fa-warehouse',
        'company': 'fas fa-building',
        'pharmacy': 'fas fa-clinic-medical',
        'admin': 'fas fa-user-shield'
    };
    return icons[type] || 'fas fa-user';
}

/**
 * الحصول على تسمية نوع المشارك
 */
function getParticipantTypeLabel(type) {
    const labels = {
        'warehouse': 'مخزن',
        'company': 'شركة',
        'pharmacy': 'صيدلية',
        'admin': 'مدير'
    };
    return labels[type] || 'غير محدد';
}

/**
 * فتح محادثة
 */
async function openConversation(conversationId, participantId, participantType, participantName) {
    currentConversationId = conversationId;
    currentParticipantId = participantId;
    currentParticipantType = participantType;

    // تحديث العنوان
    const headerName = document.getElementById('chatParticipantName');
    const headerType = document.getElementById('chatParticipantType');
    if (headerName) headerName.textContent = participantName;
    if (headerType) headerType.textContent = getParticipantTypeLabel(participantType);

    // إظهار منطقة الإدخال
    const inputContainer = document.getElementById('chatInputContainer');
    if (inputContainer) inputContainer.classList.remove('hidden');

    // تحديث التحديد في القائمة
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('bg-blue-50');
    });
    const selectedItem = document.querySelector(`.conversation-item[onclick*="${conversationId}"]`);
    if (selectedItem) selectedItem.classList.add('bg-blue-50');

    // جلب الرسائل
    await loadChatMessages(conversationId);

    // بدء الاستطلاع للرسائل الجديدة
    startChatPolling(conversationId);
}

/**
 * جلب رسائل المحادثة
 */
async function loadChatMessages(conversationId) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!client || !user) return;

    try {
        const { data, error } = await client
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        chatMessages = data || [];
        renderChatMessages();

        // تحديث الرسائل كمقروءة
        await markMessagesAsRead(conversationId, user.id);
    } catch (error) {
        console.error('❌ خطأ في جلب الرسائل:', error);
    }
}

/**
 * عرض الرسائل
 */
function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-comments text-4xl mb-3"></i>
                <p>لا توجد رسائل بعد</p>
            </div>
        `;
        return;
    }

    container.innerHTML = chatMessages.map(msg => {
        const isSender = msg.sender_id === user.id;
        const time = formatChatTime(msg.created_at);
        
        return `
            <div class="flex ${isSender ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md ${isSender ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-3 shadow-sm">
                    <p class="text-sm">${msg.message_text}</p>
                    <p class="text-xs ${isSender ? 'text-blue-100' : 'text-gray-400'} mt-1">${time}</p>
                </div>
            </div>
        `;
    }).join('');

    // التمرير للأسفل
    container.scrollTop = container.scrollHeight;
}

/**
 * إرسال رسالة
 */
async function sendChatMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input || !currentConversationId) return;

    const messageText = input.value.trim();
    if (!messageText) return;

    const user = getCurrentUser();
    if (!user) return;

    // تحديد نوع المرسل
    const senderType = getUserType(user);

    try {
        const client = getSupabaseClient();
        if (!client) return;

        // إرسال الرسالة
        const { data, error } = await client
            .from('chat_messages')
            .insert([{
                conversation_id: currentConversationId,
                sender_id: user.id,
                sender_type: senderType,
                message_text: messageText,
                is_read: false
            }])
            .select()
            .single();

        if (error) throw error;

        // تحديث last_message_at في المحادثة
        await client
            .from('conversations')
            .update({ 
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', currentConversationId);

        // إضافة الرسالة للقائمة المحلية
        chatMessages.push(data);
        renderChatMessages();

        // مسح حقل الإدخال
        input.value = '';

        // إعادة تحميل قائمة المحادثات
        await loadConversations();
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        alert('حدث خطأ أثناء إرسال الرسالة');
    }
}

/**
 * معالجة الضغط على Enter لإرسال الرسالة
 */
function handleChatMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

/**
 * تحديد نوع المستخدم
 */
function getUserType(user) {
    if (user.role === 'warehouse') return 'warehouse';
    if (user.role === 'company') return 'company';
    if (user.role === 'pharmacy') return 'pharmacy';
    if (user.role === 'admin') return 'admin';
    return 'warehouse'; // افتراضي
}

/**
 * إنشاء محادثة جديدة
 */
async function createConversation(participantId, participantType) {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!client || !user) return null;

    try {
        const senderType = getUserType(user);

        // التحقق من وجود محادثة موجودة
        const { data: existingConv } = await client
            .from('conversations')
            .select('*')
            .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${participantId}),and(participant1_id.eq.${participantId},participant2_id.eq.${user.id})`)
            .maybeSingle();

        if (existingConv) {
            return existingConv.id;
        }

        // إنشاء محادثة جديدة
        const { data, error } = await client
            .from('conversations')
            .insert([{
                participant1_id: user.id,
                participant1_type: senderType,
                participant2_id: participantId,
                participant2_type: participantType
            }])
            .select()
            .single();

        if (error) throw error;

        return data.id;
    } catch (error) {
        console.error('❌ خطأ في إنشاء المحادثة:', error);
        return null;
    }
}

/**
 * تحديث الرسائل كمقروءة
 */
async function markMessagesAsRead(conversationId, userId) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        await client
            .from('chat_messages')
            .update({ 
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة القراءة:', error);
    }
}

/**
 * بدء الاستطلاع للرسائل الجديدة
 */
function startChatPolling(conversationId) {
    // إيقاف الاستطلاع السابق
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    // بدء استطلاع جديد كل 3 ثوان
    chatPollingInterval = setInterval(async () => {
        if (currentConversationId === conversationId) {
            await loadChatMessages(conversationId);
            await loadConversations(); // تحديث عدد الرسائل غير المقروءة
        }
    }, 3000);
}

/**
 * إيقاف الاستطلاع
 */
function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

/**
 * تنسيق تاريخ المحادثة
 */
function formatChatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-EG');
}

/**
 * تنسيق وقت الرسالة
 */
function formatChatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

/**
 * جلب جميع المستخدمين المتاحين للمحادثة (الشركات والمخازن والصيدليات)
 */
async function loadAvailableParticipants() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    if (!client || !user) return [];

    try {
        const participants = [];

        // جلب المخازن
        const { data: warehouses } = await client
            .from('warehouse_users')
            .select('id, users!inner(id, name, email)')
            .neq('users.id', user.id);

        if (warehouses) {
            warehouses.forEach(w => {
                participants.push({
                    id: w.users.id,
                    name: w.users.name,
                    type: 'warehouse',
                    email: w.users.email
                });
            });
        }

        // جلب الشركات
        const { data: companies } = await client
            .from('companies_users')
            .select('id, company_name, users!inner(id, name, email)')
            .neq('users.id', user.id);

        if (companies) {
            companies.forEach(c => {
                participants.push({
                    id: c.users.id,
                    name: c.company_name || c.users.name,
                    type: 'company',
                    email: c.users.email
                });
            });
        }

        // جلب الصيدليات
        const { data: pharmacies } = await client
            .from('pharmacies_users')
            .select('id, users!inner(id, name, email)')
            .neq('users.id', user.id);

        if (pharmacies) {
            pharmacies.forEach(p => {
                participants.push({
                    id: p.users.id,
                    name: p.users.name,
                    type: 'pharmacy',
                    email: p.users.email
                });
            });
        }

        // جلب الأدمن
        const { data: admins } = await client
            .from('users')
            .select('id, name, email')
            .eq('role', 'admin')
            .neq('id', user.id);

        if (admins) {
            admins.forEach(a => {
                participants.push({
                    id: a.id,
                    name: a.name,
                    type: 'admin',
                    email: a.email
                });
            });
        }

        return participants;
    } catch (error) {
        console.error('❌ خطأ في جلب المشاركين:', error);
        return [];
    }
}

/**
 * فتح محادثة جديدة مع مستخدم
 */
async function startNewConversation(participantId, participantType, participantName) {
    // إنشاء محادثة جديدة أو فتح موجودة
    const conversationId = await createConversation(participantId, participantType);
    if (conversationId) {
        await openConversation(conversationId, participantId, participantType, participantName);
        // إعادة تحميل قائمة المحادثات
        await loadConversations();
    }
}

/**
 * فتح نافذة بدء محادثة جديدة
 */
async function openNewChatModal() {
    const participants = await loadAvailableParticipants();
    
    if (participants.length === 0) {
        alert('لا توجد مستخدمين متاحين للمحادثة');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'newChatModal';
    
    const participantsList = participants.map(p => {
        const icon = getParticipantTypeIcon(p.type);
        const label = getParticipantTypeLabel(p.type);
        return `
            <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                 onclick="startNewConversation('${p.id}', '${p.type}', '${p.name.replace(/'/g, "\\'")}'); document.getElementById('newChatModal').remove();">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="${icon} text-blue-600"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${p.name}</h4>
                        <p class="text-sm text-gray-500">${label}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">بدء محادثة جديدة</h3>
                    <button onclick="document.getElementById('newChatModal').remove()" 
                            class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <input type="text" 
                           id="newChatSearchInput" 
                           placeholder="ابحث عن مستخدم..."
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           onkeyup="filterNewChatParticipants(this.value)">
                </div>
                
                <div id="newChatParticipantsList" class="space-y-3">
                    ${participantsList}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // حفظ قائمة المشاركين في dataset
    modal.dataset.participants = JSON.stringify(participants);
}

/**
 * تصفية المشاركين في نافذة المحادثة الجديدة
 */
function filterNewChatParticipants(searchTerm) {
    const modal = document.getElementById('newChatModal');
    if (!modal) return;

    const participants = JSON.parse(modal.dataset.participants || '[]');
    const container = document.getElementById('newChatParticipantsList');
    if (!container) return;

    if (!searchTerm || searchTerm.trim() === '') {
        // إعادة عرض القائمة الكاملة
        const participantsList = participants.map(p => {
            const icon = getParticipantTypeIcon(p.type);
            const label = getParticipantTypeLabel(p.type);
            return `
                <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                     onclick="startNewConversation('${p.id}', '${p.type}', '${p.name.replace(/'/g, "\\'")}'); document.getElementById('newChatModal').remove();">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="${icon} text-blue-600"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${p.name}</h4>
                            <p class="text-sm text-gray-500">${label}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = participantsList;
        return;
    }

    const filtered = participants.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-search text-4xl mb-3"></i>
                <p>لا توجد نتائج</p>
            </div>
        `;
        return;
    }

    const participantsList = filtered.map(p => {
        const icon = getParticipantTypeIcon(p.type);
        const label = getParticipantTypeLabel(p.type);
        return `
            <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                 onclick="startNewConversation('${p.id}', '${p.type}', '${p.name.replace(/'/g, "\\'")}'); document.getElementById('newChatModal').remove();">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="${icon} text-blue-600"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${p.name}</h4>
                        <p class="text-sm text-gray-500">${label}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = participantsList;
}

// جعل الدوال متاحة عالمياً
window.loadConversations = loadConversations;
window.openConversation = openConversation;
window.sendChatMessage = sendChatMessage;
window.handleChatMessageKeyPress = handleChatMessageKeyPress;
window.startNewConversation = startNewConversation;
window.loadAvailableParticipants = loadAvailableParticipants;
window.openNewChatModal = openNewChatModal;
window.filterConversations = filterConversations;
window.filterNewChatParticipants = filterNewChatParticipants;
/**
 * تصفية قائمة المحادثات حسب الاسم أو آخر رسالة
 */
function filterConversations(searchTerm) {
    const container = document.getElementById('conversationsList');
    if (!container) return;

    const term = (searchTerm || '').toLowerCase().trim();
    const items = container.querySelectorAll('.conversation-item');
    if (!items || items.length === 0) return;

    items.forEach(item => {
        const name = (item.querySelector('h4')?.textContent || '').toLowerCase();
        const lastMsg = (item.querySelector('p.text-sm')?.textContent || '').toLowerCase();
        if (!term || name.includes(term) || lastMsg.includes(term)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}


