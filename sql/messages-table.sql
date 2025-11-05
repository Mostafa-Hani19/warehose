-- جدول الرسائل والطلبات من المستخدمين
-- ملاحظة: RLS Policies معطلة مؤقتاً (WITH CHECK true) لأن النظام يستخدم custom authentication
-- التحكم في الصلاحيات يتم من جانب التطبيق (JavaScript layer)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    subject TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('مشكلة', 'طلب', 'استفسار', 'اقتراح')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'جديدة' CHECK (status IN ('جديدة', 'قيد المراجعة', 'تم الحل', 'مغلقة')),
    priority TEXT DEFAULT 'عادية' CHECK (priority IN ('عادية', 'عالية', 'عاجلة')),
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- تفعيل RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدمون يرون رسائلهم فقط
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (true);  -- مؤقتاً: السماح للجميع بالقراءة (سيتم تحسينه لاحقاً)

-- سياسة: المستخدمون يمكنهم إنشاء رسائل
CREATE POLICY "Users can create messages"
    ON messages FOR INSERT
    WITH CHECK (true);  -- السماح للجميع بالإضافة

-- سياسة: الأدمن يرى جميع الرسائل
CREATE POLICY "Admin can view all messages"
    ON messages FOR SELECT
    USING (true);  -- السماح للجميع بالقراءة (سيتم التحكم من جانب التطبيق)

-- سياسة: الأدمن يمكنه تحديث الرسائل
CREATE POLICY "Admin can update messages"
    ON messages FOR UPDATE
    USING (true);  -- السماح للجميع بالتحديث (سيتم التحكم من جانب التطبيق)

-- تعليق على الجدول
COMMENT ON TABLE messages IS 'جدول رسائل المستخدمين والطلبات والمشاكل';

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at عند التعديل
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
