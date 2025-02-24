/*
  # Add Database Trigger for Supplier Creation

  1. Changes
    - Add function to create supplier record on user signup
    - Add trigger to automatically create supplier record
  
  2. Security
    - Maintains existing RLS policies
    - Automatically links auth.users with suppliers table
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.suppliers (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert supplier record for existing users if they don't exist
INSERT INTO public.suppliers (id, email, name)
SELECT id, email, email as name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.suppliers)
ON CONFLICT (id) DO NOTHING;