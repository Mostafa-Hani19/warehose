-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying,
  phone character varying,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.companies_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text,
  tax_number character varying,
  commercial_license character varying,
  created_at timestamp with time zone DEFAULT now(),
  company_name character varying,
  region character varying,
  phone character varying,
  CONSTRAINT companies_users_pkey PRIMARY KEY (id),
  CONSTRAINT companies_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.company_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_medicine_id uuid NOT NULL,
  batch_number character varying NOT NULL,
  manufacture_date date NOT NULL,
  expiry_date date NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_batches_pkey PRIMARY KEY (id),
  CONSTRAINT company_batches_company_medicine_id_fkey FOREIGN KEY (company_medicine_id) REFERENCES public.company_medicines(id)
);
CREATE TABLE public.company_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_user_id uuid NOT NULL,
  discount_type character varying NOT NULL CHECK (discount_type::text = ANY (ARRAY['percentage'::character varying, 'buy_get'::character varying]::text[])),
  name character varying NOT NULL,
  description text,
  percentage numeric,
  min_order_amount numeric,
  buy_quantity integer,
  get_quantity integer,
  medicine_id uuid,
  is_active boolean DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_discounts_pkey PRIMARY KEY (id),
  CONSTRAINT company_discounts_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.company_medicines(id),
  CONSTRAINT company_discounts_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.companies_users(id)
);
CREATE TABLE public.company_medicines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  category character varying NOT NULL DEFAULT 'غير مصنف'::character varying,
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL,
  expiry_date date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_user_id uuid,
  manufacture_date date,
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
  strip_quantity integer DEFAULT 0,
  international_barcode character varying,
  english_name character varying,
  CONSTRAINT company_medicines_pkey PRIMARY KEY (id),
  CONSTRAINT company_medicines_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.companies_users(id)
);
CREATE TABLE public.medicines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL,
  expiry_date date NOT NULL,
  company_name character varying,
  notes text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category character varying NOT NULL DEFAULT 'غير مصنف'::character varying,
  discount_percentage numeric DEFAULT 0.00 CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
  international_barcode character varying,
  english_name character varying,
  strip_quantity integer DEFAULT 0 CHECK (strip_quantity >= 0),
  company_id uuid,
  CONSTRAINT medicines_pkey PRIMARY KEY (id),
  CONSTRAINT medicines_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT medicines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_role text NOT NULL,
  subject text NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['مشكلة'::text, 'طلب'::text, 'استفسار'::text, 'اقتراح'::text])),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'جديدة'::text CHECK (status = ANY (ARRAY['جديدة'::text, 'قيد المراجعة'::text, 'تم الحل'::text, 'مغلقة'::text])),
  priority text DEFAULT 'عادية'::text CHECK (priority = ANY (ARRAY['عادية'::text, 'عالية'::text, 'عاجلة'::text])),
  admin_reply text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  medicine_name character varying NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  total_price numeric NOT NULL,
  batch_number character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  order_number character varying NOT NULL UNIQUE,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  credit_deduction numeric DEFAULT 0,
  final_amount numeric,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_method text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies_users(id)
);
CREATE TABLE public.pharmacies_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text,
  license_number character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacies_users_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacies_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.return_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL,
  medicine_name character varying NOT NULL,
  quantity integer NOT NULL,
  batch_number character varying,
  expiry_date date,
  price numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT return_items_pkey PRIMARY KEY (id),
  CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id)
);
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_type character varying NOT NULL CHECK (requester_type::text = ANY (ARRAY['pharmacy'::character varying, 'warehouse'::character varying]::text[])),
  requester_name character varying NOT NULL,
  company_id uuid NOT NULL,
  company_name character varying NOT NULL,
  return_type character varying NOT NULL CHECK (return_type::text = ANY (ARRAY['damaged'::character varying, 'expired'::character varying]::text[])),
  order_number character varying,
  reason text NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  approval_message text,
  refund_amount numeric,
  compensation_type character varying CHECK (compensation_type::text = ANY (ARRAY['invoice_deduction'::character varying, 'cash_transfer'::character varying]::text[])),
  total_return_value numeric,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT returns_pkey PRIMARY KEY (id),
  CONSTRAINT returns_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id),
  CONSTRAINT returns_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies_users(id)
);
CREATE TABLE public.user_company_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  credit_balance numeric NOT NULL DEFAULT 0 CHECK (credit_balance >= 0::numeric),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT user_company_credits_pkey PRIMARY KEY (id),
  CONSTRAINT user_company_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_company_credits_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies_users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'warehouse'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'warehouse'::character varying, 'pharmacy'::character varying, 'customer'::character varying, 'company'::character varying]::text[])),
  name character varying,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_approved boolean DEFAULT false,
  approved_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.warehouse_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text,
  license_number character varying,
  region character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT warehouse_users_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);


ALTER TABLE orders
ADD COLUMN supplier_type text DEFAULT 'company' CHECK (supplier_type IN ('company', 'warehouse')),
ADD COLUMN warehouse_id uuid REFERENCES warehouse_users(id);
