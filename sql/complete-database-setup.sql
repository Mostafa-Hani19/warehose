import uuid

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'warehouse' CHECK (role IN ('admin', 'warehouse', 'pharmacy', 'customer')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول شركات الأدوية
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأدوية
CREATE TABLE IF NOT EXISTS medicines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255),
    category VARCHAR(255) NOT NULL DEFAULT 'غير مصنف',
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    expiry_date DATE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    company_name VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    international_barcode VARCHAR(255),
    strip_quantity INTEGER DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    pharmacy_id UUID REFERENCES users(id),
    pharmacy_name VARCHAR(255),
    warehouse_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تفاصيل الطلب
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول العمليات (وارد/صادر)
CREATE TABLE IF NOT EXISTS operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('in', 'out')),
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول مدفوعات الطلبات
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Functions and Triggers
-- ============================================

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الـ triggers على جميع الجداول
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medicines_updated_at ON medicines;
CREATE TRIGGER update_medicines_updated_at 
    BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Views
-- ============================================

-- عرض الأدوية مع الشركة
DROP VIEW IF EXISTS medicines_view;
CREATE VIEW medicines_view AS
SELECT 
    m.*,
    c.name as company_full_name,
    c.email as company_email,
    c.phone as company_phone
FROM medicines m
LEFT JOIN companies c ON m.company_id = c.id;

-- عرض الطلبات مع التفاصيل
DROP VIEW IF EXISTS orders_view;
CREATE VIEW orders_view AS
SELECT 
    o.*,
    u.name as pharmacy_name_display,
    COUNT(oi.id) as items_count,
    SUM(oi.total_price) as calculated_total
FROM orders o
LEFT JOIN users u ON o.pharmacy_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name;

-- ============================================
-- 4. Indexes
-- ============================================

-- Indexes للمستخدمين
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Indexes للشركات
CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Indexes للأدوية
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_user ON medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);

-- Indexes للطلبات
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Indexes لتفاصيل الطلبات
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine ON order_items(medicine_id);

-- Indexes للعمليات
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_operations_medicine ON operations(medicine_id);
CREATE INDEX IF NOT EXISTS idx_operations_created_by ON operations(created_by);
CREATE INDEX IF NOT EXISTS idx_operations_date ON operations(created_at);

-- ============================================
-- 5. إنشاء المستخدم الافتراضي
-- ============================================

-- حذف المستخدم الافتراضي إذا كان موجوداً
DELETE FROM users WHERE username = 'warehouse';

-- إنشاء المستخدم الافتراضي الجديد
-- ملاحظة: كلمات المرور مخزنة كنص عادي
-- كلمة المرور الافتراضية هي "warehouse123"
INSERT INTO users (id, username, password, role, name, email, phone)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'warehouse',
    'warehouse123',
    'warehouse',
    'محمد المخزن',
    'warehouse@system.com',
    '01000000002'
)
ON CONFLICT (username) DO UPDATE SET
    id = EXCLUDED.id,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- ============================================
-- 6. التحقق من التثبيت
-- ============================================

-- التحقق من إنشاء الجداول
SELECT 'Tables created successfully' as status;

-- التحقق من المستخدم الافتراضي
SELECT * FROM users WHERE username = 'warehouse';

-- إحصائيات قاعدة البيانات
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'medicines', COUNT(*) FROM medicines
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'operations', COUNT(*) FROM operations;

-- ============================================
-- تم التثبيت بنجاح! ✅
-- ============================================




-- ============================================
-- updates and fixes ✅
-- ============================================

-- update the medicines table to add the category column
ALTER TABLE medicines ADD COLUMN category VARCHAR(255) NOT NULL DEFAULT 'غير مصنف';
 
-- update the users table to add the company column
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'warehouse', 'pharmacy', 'customer', 'company'));

--  Enable row level security on the companies table  
  ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- create policies for the companies table
  -- For INSERT
  CREATE POLICY "Companies insert policy" ON companies 
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
  -- For SELECT
  CREATE POLICY "Companies select policy" ON companies 
  FOR SELECT USING (user_id = auth.uid());
  
  -- For UPDATE
  CREATE POLICY "Companies update policy" ON companies 
  FOR UPDATE USING (user_id = auth.uid());
  
  -- For DELETE
  CREATE POLICY "Companies delete policy" ON companies 
  FOR DELETE USING (user_id = auth.uid());