-- Fix missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add policy for users to update their phone in profiles
CREATE POLICY "Users can update their profile phone"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);