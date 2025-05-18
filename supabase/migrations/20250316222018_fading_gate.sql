/*
  # Add public access to product categories

  1. Changes
    - Add policy to allow public access to read product categories
    - This ensures both authenticated and unauthenticated users can view categories

  2. Security
    - Only allows reading (SELECT) operations
    - No modification of data is allowed for public users
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Everyone can read product categories" ON product_categories;

-- Create new policy for public access
CREATE POLICY "Anyone can read product categories"
  ON product_categories
  FOR SELECT
  TO public
  USING (true);