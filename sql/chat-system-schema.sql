-- ============================================
-- نظام الشات - Chat System
-- ============================================

-- جدول المحادثات (Conversations)
CREATE TABLE IF NOT EXISTS conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant1_id uuid NOT NULL, -- المستخدم الأول (المخزن/الشركة/الصيدلية)
    participant1_type character varying NOT NULL CHECK (participant1_type IN ('warehouse', 'company', 'pharmacy', 'admin')),
    participant2_id uuid NOT NULL, -- المستخدم الثاني (المخزن/الشركة/الصيدلية)
    participant2_type character varying NOT NULL CHECK (participant2_type IN ('warehouse', 'company', 'pharmacy', 'admin')),
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_participant1_id_fkey FOREIGN KEY (participant1_id) REFERENCES public.users(id),
    CONSTRAINT conversations_participant2_id_fkey FOREIGN KEY (participant2_id) REFERENCES public.users(id)
    -- ملاحظة: تم إزالة unique constraint لأنه قد يمنع محادثة بين نفس المستخدمين في حالات معينة
);

-- جدول الرسائل (Messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL, -- مرسل الرسالة
    sender_type character varying NOT NULL CHECK (sender_type IN ('warehouse', 'company', 'pharmacy', 'admin')),
    message_text text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
    CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- دالة للحصول على اسم المشارك الآخر في المحادثة
CREATE OR REPLACE FUNCTION get_conversation_participant_name(
    p_user_id uuid,
    p_user_type character varying,
    p_participant1_id uuid,
    p_participant1_type character varying,
    p_participant2_id uuid,
    p_participant2_type character varying
) RETURNS text AS $$
DECLARE
    participant_id uuid;
    participant_type character varying;
    participant_name text;
BEGIN
    -- تحديد المشارك الآخر
    IF p_user_id = p_participant1_id THEN
        participant_id := p_participant2_id;
        participant_type := p_participant2_type;
    ELSE
        participant_id := p_participant1_id;
        participant_type := p_participant1_type;
    END IF;
    
    -- جلب الاسم حسب النوع
    IF participant_type = 'warehouse' THEN
        SELECT u.name INTO participant_name
        FROM users u
        JOIN warehouse_users wu ON wu.user_id = u.id
        WHERE u.id = participant_id;
    ELSIF participant_type = 'company' THEN
        SELECT COALESCE(cu.company_name, u.name) INTO participant_name
        FROM users u
        JOIN companies_users cu ON cu.user_id = u.id
        WHERE u.id = participant_id;
    ELSIF participant_type = 'pharmacy' THEN
        SELECT u.name INTO participant_name
        FROM users u
        JOIN pharmacies_users pu ON pu.user_id = u.id
        WHERE u.id = participant_id;
    ELSIF participant_type = 'admin' THEN
        SELECT u.name INTO participant_name
        FROM users u
        WHERE u.id = participant_id AND u.role = 'admin';
    END IF;
    
    RETURN COALESCE(participant_name, 'غير محدد');
END;
$$ LANGUAGE plpgsql;

