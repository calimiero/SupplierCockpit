/*
  # Initial Schema Setup for SupplierCockpit

  1. New Tables
    - suppliers
      - id (uuid, primary key)
      - name (text)
      - email (text)
      - created_at (timestamp)
    - quality_parameters
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - unit (text)
      - min_value (numeric)
      - max_value (numeric)
      - created_at (timestamp)
    - measurements
      - id (uuid, primary key)
      - supplier_id (uuid, foreign key)
      - parameter_id (uuid, foreign key)
      - value (numeric)
      - measured_at (timestamp)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated suppliers to read and write their own data
*/

-- Create suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quality_parameters table
CREATE TABLE quality_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit text NOT NULL,
  min_value numeric,
  max_value numeric,
  created_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  parameter_id uuid REFERENCES quality_parameters(id) NOT NULL,
  value numeric NOT NULL,
  measured_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers
CREATE POLICY "Suppliers can read own data"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policies for quality parameters
CREATE POLICY "Quality parameters are readable by all authenticated users"
  ON quality_parameters
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for measurements
CREATE POLICY "Suppliers can read own measurements"
  ON measurements
  FOR SELECT
  TO authenticated
  USING (supplier_id::text = auth.uid()::text);

CREATE POLICY "Suppliers can insert own measurements"
  ON measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id::text = auth.uid()::text);

CREATE POLICY "Suppliers can update own measurements"
  ON measurements
  FOR UPDATE
  TO authenticated
  USING (supplier_id::text = auth.uid()::text)
  WITH CHECK (supplier_id::text = auth.uid()::text);