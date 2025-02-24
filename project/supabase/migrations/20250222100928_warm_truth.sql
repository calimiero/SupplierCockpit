/*
  # Create initial supplier user

  1. Changes
    - Insert initial supplier record for test user
  
  2. Security
    - Uses existing RLS policies
*/

-- Insert a supplier record for the test user
INSERT INTO suppliers (id, name, email)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Test Supplier', 'supplier@test.com');