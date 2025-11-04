-- Add sale date fields to products table
ALTER TABLE public.products
ADD COLUMN sale_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN sale_end_date TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on date queries
CREATE INDEX idx_products_sale_dates ON public.products(sale_start_date, sale_end_date) WHERE is_sale = true;

-- Create function to automatically update sale status based on dates
CREATE OR REPLACE FUNCTION public.update_sale_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enable sale for products within sale period
  UPDATE public.products
  SET is_sale = true
  WHERE sale_start_date IS NOT NULL
    AND sale_end_date IS NOT NULL
    AND NOW() BETWEEN sale_start_date AND sale_end_date
    AND is_sale = false;

  -- Disable sale for products outside sale period
  UPDATE public.products
  SET is_sale = false
  WHERE sale_end_date IS NOT NULL
    AND NOW() > sale_end_date
    AND is_sale = true;
    
  -- Also disable sale if start date is in future
  UPDATE public.products
  SET is_sale = false
  WHERE sale_start_date IS NOT NULL
    AND NOW() < sale_start_date
    AND is_sale = true;
END;
$$;