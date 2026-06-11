-- ============================================================
-- JOHN-NEW-POS: Full Database Schema
-- Apply this to a fresh Supabase project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- tenants
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  settings jsonb NOT NULL DEFAULT '{"currency": "USD", "low_stock_threshold": 10}'::jsonb,
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

-- stores
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT unique_store_name_per_tenant UNIQUE (tenant_id, name)
);

-- users (mirrors auth.users)
CREATE TABLE public.users (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  store_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

-- customers
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  total_purchases numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_credit_approved boolean DEFAULT false,
  credit_limit numeric DEFAULT NULL,
  store_id uuid NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

-- products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sku text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric,
  cost numeric DEFAULT 0,
  tax_rate numeric DEFAULT NULL,
  base_unit text NOT NULL,
  purchase_unit text NOT NULL,
  unit_conversion_ratio numeric NOT NULL DEFAULT 1,
  stock_quantity numeric NOT NULL DEFAULT 0,
  low_stock_threshold numeric NOT NULL DEFAULT 10,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  image_url text,
  is_variable_price boolean DEFAULT false,
  barcode text,
  store_id uuid NOT NULL,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT products_tenant_id_sku_key UNIQUE (tenant_id, sku)
);
-- transaction_counters
CREATE TABLE public.transaction_counters (
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  CONSTRAINT transaction_counters_pkey PRIMARY KEY (tenant_id, date)
);

-- transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  transaction_number text NOT NULL,
  customer_id uuid,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'completed'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  served_by uuid,
  outstanding_balance numeric,
  store_id uuid NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT transactions_served_by_fkey FOREIGN KEY (served_by) REFERENCES public.users(id),
  CONSTRAINT transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT transactions_tenant_id_transaction_number_key UNIQUE (tenant_id, transaction_number)
);

-- transaction_items
CREATE TABLE public.transaction_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  tax_rate numeric DEFAULT NULL,
  tax_amount numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transaction_items_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- debt_payments
CREATE TABLE public.debt_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method varchar(20) NOT NULL,
  payment_date timestamptz DEFAULT now(),
  recorded_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT debt_payments_pkey PRIMARY KEY (id),
  CONSTRAINT debt_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT debt_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT debt_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);

-- return_counters
CREATE TABLE public.return_counters (
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  CONSTRAINT return_counters_pkey PRIMARY KEY (tenant_id, date)
);

-- returns
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  return_number text NOT NULL,
  transaction_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  total_amount numeric NOT NULL,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  store_id uuid NOT NULL,
  CONSTRAINT returns_pkey PRIMARY KEY (id),
  CONSTRAINT returns_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT returns_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT returns_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
  CONSTRAINT returns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT returns_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT returns_tenant_id_return_number_key UNIQUE (tenant_id, return_number)
);

-- return_items
CREATE TABLE public.return_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  return_id uuid NOT NULL,
  transaction_item_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT return_items_pkey PRIMARY KEY (id),
  CONSTRAINT return_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id),
  CONSTRAINT return_items_transaction_item_id_fkey FOREIGN KEY (transaction_item_id) REFERENCES public.transaction_items(id),
  CONSTRAINT return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- stock_history
CREATE TABLE public.stock_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  type text NOT NULL,
  quantity_change numeric NOT NULL,
  quantity_after numeric NOT NULL,
  reason text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  store_id uuid NOT NULL,
  CONSTRAINT stock_history_pkey PRIMARY KEY (id),
  CONSTRAINT stock_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT stock_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT stock_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT stock_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

-- expense_categories
CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT expense_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT expense_categories_tenant_id_name_key UNIQUE (tenant_id, name)
);

-- expenses
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount numeric NOT NULL,
  description text,
  receipt_reference varchar(100),
  expense_date date NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  store_id uuid NOT NULL,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT expenses_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

-- expense_audit
CREATE TABLE public.expense_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  changes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT expense_audit_pkey PRIMARY KEY (id),
  CONSTRAINT expense_audit_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id),
  CONSTRAINT expense_audit_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

-- po_counters
CREATE TABLE public.po_counters (
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  CONSTRAINT po_counters_pkey PRIMARY KEY (tenant_id, date)
);

-- purchase_orders
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  po_number text NOT NULL,
  supplier_name text NOT NULL,
  supplier_contact text,
  status text NOT NULL DEFAULT 'draft'::text,
  expected_delivery_date date,
  total_cost numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  store_id uuid NOT NULL,
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT purchase_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT purchase_orders_tenant_id_po_number_key UNIQUE (tenant_id, po_number)
);

-- purchase_order_items
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  purchase_order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  cost_per_unit numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id),
  CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- tour system tables
CREATE TABLE public.user_tour_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  tour_id varchar(100) NOT NULL,
  status varchar(20) NOT NULL,
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 0,
  completed_at timestamp,
  started_at timestamp,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT user_tour_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_tour_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_tour_progress_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_tour_progress_user_id_tour_id_key UNIQUE (user_id, tour_id)
);

CREATE TABLE public.user_tour_hints_dismissed (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  hint_id varchar(100) NOT NULL,
  dismissed_at timestamp DEFAULT now(),
  CONSTRAINT user_tour_hints_dismissed_pkey PRIMARY KEY (id),
  CONSTRAINT user_tour_hints_dismissed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_tour_hints_dismissed_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT user_tour_hints_dismissed_user_id_hint_id_key UNIQUE (user_id, hint_id)
);

CREATE TABLE public.tour_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  tour_id varchar(100) NOT NULL,
  step_id varchar(100),
  event_type varchar(50) NOT NULL,
  user_id uuid,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  CONSTRAINT tour_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT tour_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT tour_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
-- ============================================================
-- INDEXES
-- ============================================================

-- customers
CREATE INDEX idx_customers_tenant ON public.customers USING btree (tenant_id);
CREATE INDEX idx_customers_tenant_id ON public.customers USING btree (tenant_id);
CREATE INDEX idx_customers_tenant_name ON public.customers USING btree (tenant_id, name);
CREATE INDEX idx_customers_store_id ON public.customers USING btree (store_id);
CREATE INDEX idx_customers_tenant_store ON public.customers USING btree (tenant_id, store_id);
CREATE INDEX idx_customers_credit_approved ON public.customers USING btree (is_credit_approved) WHERE (is_credit_approved = true);

-- debt_payments
CREATE INDEX idx_debt_payments_tenant_id ON public.debt_payments USING btree (tenant_id);
CREATE INDEX idx_debt_payments_transaction_id ON public.debt_payments USING btree (transaction_id);
CREATE INDEX idx_debt_payments_recorded_by ON public.debt_payments USING btree (recorded_by);
CREATE INDEX idx_debt_payments_payment_date ON public.debt_payments USING btree (payment_date);

-- expense_audit
CREATE INDEX idx_expense_audit_expense_id ON public.expense_audit USING btree (expense_id);

-- expense_categories
CREATE INDEX idx_expense_categories_tenant_id ON public.expense_categories USING btree (tenant_id);

-- expenses
CREATE INDEX idx_expenses_tenant_id ON public.expenses USING btree (tenant_id);
CREATE INDEX idx_expenses_category_id ON public.expenses USING btree (category_id);
CREATE INDEX idx_expenses_created_by ON public.expenses USING btree (created_by);
CREATE INDEX idx_expenses_expense_date ON public.expenses USING btree (expense_date);
CREATE INDEX idx_expenses_store_id ON public.expenses USING btree (store_id);
CREATE INDEX idx_expenses_tenant_store ON public.expenses USING btree (tenant_id, store_id);

-- products
CREATE INDEX idx_products_tenant_id ON public.products USING btree (tenant_id);
CREATE INDEX idx_products_tenant_sku ON public.products USING btree (tenant_id, sku);
CREATE INDEX idx_products_tenant_archived ON public.products USING btree (tenant_id, is_archived);
CREATE INDEX idx_products_tenant_archived_stock ON public.products USING btree (tenant_id, is_archived, stock_quantity);
CREATE INDEX idx_products_tenant_category ON public.products USING btree (tenant_id, category) WHERE (is_archived = false);
CREATE INDEX idx_products_store_id ON public.products USING btree (store_id);
CREATE INDEX idx_products_tenant_store ON public.products USING btree (tenant_id, store_id);
CREATE INDEX idx_products_search ON public.products USING gin (to_tsvector('english'::regconfig, ((name || ' '::text) || sku)));
CREATE INDEX idx_products_tax_rate ON public.products USING btree (tax_rate) WHERE (tax_rate IS NOT NULL);

-- purchase_order_items
CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items USING btree (purchase_order_id);

-- purchase_orders
CREATE INDEX idx_purchase_orders_tenant_id ON public.purchase_orders USING btree (tenant_id, status, expected_delivery_date);
CREATE INDEX idx_purchase_orders_store_id ON public.purchase_orders USING btree (store_id);
CREATE INDEX idx_purchase_orders_tenant_store ON public.purchase_orders USING btree (tenant_id, store_id);

-- return_items
CREATE INDEX idx_return_items_return_id ON public.return_items USING btree (return_id);

-- returns
CREATE INDEX idx_returns_tenant_id ON public.returns USING btree (tenant_id, status, created_at DESC);
CREATE INDEX idx_returns_transaction_id ON public.returns USING btree (transaction_id);
CREATE INDEX idx_returns_store_id ON public.returns USING btree (store_id);

-- stock_history
CREATE INDEX idx_stock_history_tenant_id ON public.stock_history USING btree (tenant_id);
CREATE INDEX idx_stock_history_product_id ON public.stock_history USING btree (product_id, created_at DESC);
CREATE INDEX idx_stock_history_product_date ON public.stock_history USING btree (product_id, created_at DESC);
CREATE INDEX idx_stock_history_store_id ON public.stock_history USING btree (store_id);
CREATE INDEX idx_stock_history_tenant_store ON public.stock_history USING btree (tenant_id, store_id);

-- stores
CREATE INDEX idx_stores_tenant_id ON public.stores USING btree (tenant_id);

-- tour_analytics
CREATE INDEX idx_tour_analytics_tenant_id ON public.tour_analytics USING btree (tenant_id);
CREATE INDEX idx_tour_analytics_tour_id ON public.tour_analytics USING btree (tour_id);
CREATE INDEX idx_tour_analytics_event_type ON public.tour_analytics USING btree (event_type);
CREATE INDEX idx_tour_analytics_created_at ON public.tour_analytics USING btree (created_at);

-- transaction_items
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items USING btree (transaction_id);
CREATE INDEX idx_transaction_items_transaction ON public.transaction_items USING btree (transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items USING btree (product_id);
CREATE INDEX idx_transaction_items_product ON public.transaction_items USING btree (product_id);
CREATE INDEX idx_transaction_items_tax ON public.transaction_items USING btree (tax_rate, tax_amount) WHERE (tax_rate IS NOT NULL);

-- transactions
CREATE INDEX idx_transactions_tenant_id ON public.transactions USING btree (tenant_id, created_at DESC);
CREATE INDEX idx_transactions_tenant_date ON public.transactions USING btree (tenant_id, created_at DESC);
CREATE INDEX idx_transactions_customer_id ON public.transactions USING btree (customer_id);
CREATE INDEX idx_transactions_created_by ON public.transactions USING btree (created_by, created_at DESC);
CREATE INDEX idx_transactions_served_by ON public.transactions USING btree (served_by);
CREATE INDEX idx_transactions_store_id ON public.transactions USING btree (store_id);
CREATE INDEX idx_transactions_tenant_store ON public.transactions USING btree (tenant_id, store_id);
CREATE INDEX idx_transactions_tenant_payment ON public.transactions USING btree (tenant_id, payment_method, created_at);
CREATE INDEX idx_transactions_outstanding_balance ON public.transactions USING btree (outstanding_balance) WHERE (outstanding_balance > (0)::numeric);
CREATE INDEX idx_transactions_tax_amount ON public.transactions USING btree (tax_amount) WHERE (tax_amount > 0);

-- user_tour_hints_dismissed
CREATE INDEX idx_user_tour_hints_user_id ON public.user_tour_hints_dismissed USING btree (user_id);

-- user_tour_progress
CREATE INDEX idx_user_tour_progress_user_id ON public.user_tour_progress USING btree (user_id);
CREATE INDEX idx_user_tour_progress_tenant_id ON public.user_tour_progress USING btree (tenant_id);
CREATE INDEX idx_user_tour_progress_status ON public.user_tour_progress USING btree (status);

-- users
CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_store_id ON public.users USING btree (store_id);
-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_transaction_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  INSERT INTO transaction_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = transaction_counters.counter + 1
  RETURNING counter INTO v_next_val;
  v_number := 'TXN-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_transaction_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := generate_transaction_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_po_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  INSERT INTO po_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = po_counters.counter + 1
  RETURNING counter INTO v_next_val;
  v_number := 'PO-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_po_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := generate_po_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_return_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  INSERT INTO return_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = return_counters.counter + 1
  RETURNING counter INTO v_next_val;
  v_number := 'RET-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_return_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.return_number IS NULL THEN
    NEW.return_number := generate_return_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_expense_categories()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO expense_categories (tenant_id, name, is_default)
  VALUES
    (NEW.id, 'Utilities', true),
    (NEW.id, 'Rent', true),
    (NEW.id, 'Supplies', true),
    (NEW.id, 'Salaries', true),
    (NEW.id, 'Miscellaneous', true);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stores_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tour_progress(
  p_user_id uuid, p_tenant_id uuid, p_tour_id text,
  p_status text, p_current_step integer, p_total_steps integer
)
RETURNS public.user_tour_progress LANGUAGE plpgsql AS $$
DECLARE
  v_progress user_tour_progress;
  v_time_spent INTEGER;
BEGIN
  IF p_status = 'completed' THEN
    SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    INTO v_time_spent
    FROM user_tour_progress
    WHERE user_id = p_user_id AND tour_id = p_tour_id;
  END IF;
  INSERT INTO user_tour_progress (
    user_id, tenant_id, tour_id, status, current_step, total_steps,
    started_at, completed_at, time_spent_seconds, updated_at
  )
  VALUES (
    p_user_id, p_tenant_id, p_tour_id, p_status, p_current_step, p_total_steps,
    CASE WHEN p_status = 'in_progress' AND NOT EXISTS (
      SELECT 1 FROM user_tour_progress WHERE user_id = p_user_id AND tour_id = p_tour_id
    ) THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    COALESCE(v_time_spent, 0), NOW()
  )
  ON CONFLICT (user_id, tour_id)
  DO UPDATE SET
    status = p_status, current_step = p_current_step, total_steps = p_total_steps,
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE user_tour_progress.completed_at END,
    time_spent_seconds = COALESCE(v_time_spent, user_tour_progress.time_spent_seconds),
    updated_at = NOW()
  RETURNING * INTO v_progress;
  RETURN v_progress;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_tour_event(
  p_tenant_id uuid, p_tour_id text, p_step_id text,
  p_event_type text, p_user_id uuid, p_metadata jsonb
)
RETURNS public.tour_analytics LANGUAGE plpgsql AS $$
DECLARE
  v_analytics tour_analytics;
BEGIN
  INSERT INTO tour_analytics (tenant_id, tour_id, step_id, event_type, user_id, metadata, created_at)
  VALUES (p_tenant_id, p_tour_id, p_step_id, p_event_type, p_user_id, p_metadata, NOW())
  RETURNING * INTO v_analytics;
  RETURN v_analytics;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER set_transaction_number_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_transaction_number();

CREATE TRIGGER trigger_set_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_po_number();

CREATE TRIGGER trigger_set_return_number
  BEFORE INSERT ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.set_return_number();

CREATE TRIGGER trigger_create_default_expense_categories
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.create_default_expense_categories();

CREATE TRIGGER trigger_update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_stores_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tour_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tour_hints_dismissed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_analytics ENABLE ROW LEVEL SECURITY;

-- tenants
CREATE POLICY "Authenticated users can create tenants" ON public.tenants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view their own tenant" ON public.tenants FOR SELECT USING (id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update their own tenant" ON public.tenants FOR UPDATE USING (id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- stores
CREATE POLICY "Users can view stores in their tenant" ON public.stores FOR SELECT USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Admins can manage stores in their tenant" ON public.stores FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND ((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin')
);

-- users
CREATE POLICY "Authenticated users can read all users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user self-registration during setup" ON public.users FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id) AND (NOT (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()))));
CREATE POLICY "Admins can insert users in tenant" ON public.users FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.tenant_id = u.tenant_id));
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update users in tenant" ON public.users FOR UPDATE USING (tenant_id IN (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')) WITH CHECK (tenant_id IN (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "Admins can delete users in tenant" ON public.users FOR DELETE USING ((id <> auth.uid()) AND (tenant_id IN (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')));

-- customers
CREATE POLICY "Users can access customers in their store" ON public.customers FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Users can insert customers in their tenant" ON public.customers FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update customers in their tenant" ON public.customers FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Admins can delete customers in their tenant" ON public.customers FOR DELETE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- products
CREATE POLICY "Users can access products in their store" ON public.products FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Admins can insert products in their tenant" ON public.products FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update products in their tenant" ON public.products FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete products in their tenant" ON public.products FOR DELETE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Users can update stock quantity in their tenant" ON public.products FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid())) WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- transactions
CREATE POLICY "Users can access transactions in their store" ON public.transactions FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Users can insert transactions in their tenant" ON public.transactions FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update transactions in their tenant" ON public.transactions FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid())) WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can view transactions based on role" ON public.transactions FOR SELECT USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND ((EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.tenant_id = transactions.tenant_id)) OR (created_by = auth.uid()))
);

-- transaction_items
CREATE POLICY "Users can insert transaction items in their tenant" ON public.transaction_items FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can view transaction items based on role" ON public.transaction_items FOR SELECT USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND ((EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.tenant_id = transaction_items.tenant_id)) OR (transaction_id IN (SELECT transactions.id FROM transactions WHERE transactions.created_by = auth.uid())))
);

-- transaction_counters
CREATE POLICY "Users can access counters in their tenant" ON public.transaction_counters FOR ALL USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- debt_payments
CREATE POLICY "Users can view debt payments in their tenant" ON public.debt_payments FOR SELECT USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can insert debt payments in their tenant" ON public.debt_payments FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update debt payments in their tenant" ON public.debt_payments FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- returns
CREATE POLICY "Users can access returns in their store" ON public.returns FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Users can insert returns in their tenant" ON public.returns FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Admins can update returns in their tenant" ON public.returns FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "returns_select_by_role" ON public.returns FOR SELECT USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND ((EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.tenant_id = returns.tenant_id)) OR (created_by = auth.uid()))
);

-- return_items
CREATE POLICY "Users can insert return items in their tenant" ON public.return_items FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "return_items_select_by_role" ON public.return_items FOR SELECT USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND ((EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.tenant_id = return_items.tenant_id)) OR (return_id IN (SELECT returns.id FROM returns WHERE returns.created_by = auth.uid())))
);

-- return_counters
CREATE POLICY "Users can access return counters in their tenant" ON public.return_counters FOR ALL USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- stock_history
CREATE POLICY "Users can access stock history in their store" ON public.stock_history FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Users can insert stock history in their tenant" ON public.stock_history FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- expense_categories
CREATE POLICY "Users can view expense categories in their tenant" ON public.expense_categories FOR SELECT USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can insert expense categories in their tenant" ON public.expense_categories FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update expense categories in their tenant" ON public.expense_categories FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can delete expense categories in their tenant" ON public.expense_categories FOR DELETE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- expenses
CREATE POLICY "Users can access expenses in their store" ON public.expenses FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Users can insert expenses in their tenant" ON public.expenses FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update expenses in their tenant" ON public.expenses FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can delete expenses in their tenant" ON public.expenses FOR DELETE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- expense_audit
CREATE POLICY "Users can view expense audit in their tenant" ON public.expense_audit FOR SELECT USING (expense_id IN (SELECT expenses.id FROM expenses WHERE expenses.tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "Users can insert expense audit in their tenant" ON public.expense_audit FOR INSERT WITH CHECK (expense_id IN (SELECT expenses.id FROM expenses WHERE expenses.tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid())));

-- po_counters
CREATE POLICY "Users can access po counters in their tenant" ON public.po_counters FOR ALL USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()));

-- purchase_orders
CREATE POLICY "Users can access purchase orders in their store" ON public.purchase_orders FOR ALL USING (
  (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid()))
  AND (((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin') OR (store_id = (SELECT users.store_id FROM users WHERE users.id = auth.uid())))
);
CREATE POLICY "Admins can view purchase orders in their tenant" ON public.purchase_orders FOR SELECT USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can insert purchase orders in their tenant" ON public.purchase_orders FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update purchase orders in their tenant" ON public.purchase_orders FOR UPDATE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete purchase orders in their tenant" ON public.purchase_orders FOR DELETE USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- purchase_order_items
CREATE POLICY "Admins can view purchase order items in their tenant" ON public.purchase_order_items FOR SELECT USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can insert purchase order items in their tenant" ON public.purchase_order_items FOR INSERT WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- user_tour_progress
CREATE POLICY "Users can read own tour progress" ON public.user_tour_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all tour progress in tenant" ON public.user_tour_progress FOR SELECT TO authenticated USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Users can insert own tour progress" ON public.user_tour_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tour progress" ON public.user_tour_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_tour_hints_dismissed
CREATE POLICY "Users can read own dismissed hints" ON public.user_tour_hints_dismissed FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own dismissed hints" ON public.user_tour_hints_dismissed FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own dismissed hints" ON public.user_tour_hints_dismissed FOR DELETE TO authenticated USING (user_id = auth.uid());

-- tour_analytics
CREATE POLICY "Users can insert own tour analytics" ON public.tour_analytics FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read all tour analytics in tenant" ON public.tour_analytics FOR SELECT TO authenticated USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
