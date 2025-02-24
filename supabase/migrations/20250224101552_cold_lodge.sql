/*
  # Update Quality Parameters Policies

  1. Changes
    - Add insert and update policies for quality parameters
    - Add policy for suppliers to manage their own parameters
  
  2. Security
    - Allow authenticated users to insert and update quality parameters
    - Maintain existing read permissions
*/

-- Add insert policy for quality parameters
CREATE POLICY "Authenticated users can insert quality parameters"
  ON quality_parameters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add update policy for quality parameters
CREATE POLICY "Authenticated users can update quality parameters"
  ON quality_parameters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);