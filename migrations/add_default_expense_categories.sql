-- Migration: Add default expense categories for existing tenants
-- Also creates a trigger to add defaults for new tenants

-- Insert default categories for all existing tenants
INSERT INTO expense_categories (tenant_id, name, is_default)
SELECT t.id, category.name, true
FROM tenants t
CROSS JOIN (
  VALUES 
    ('Utilities'),
    ('Rent'),
    ('Supplies'),
    ('Salaries'),
    ('Miscellaneous')
) AS category(name);

-- Create function to add default categories for new tenants
CREATE OR REPLACE FUNCTION create_default_expense_categories()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to run after new tenant is created
CREATE TRIGGER trigger_create_default_expense_categories
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_default_expense_categories();
