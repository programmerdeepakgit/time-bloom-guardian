-- Update users table to support proper authentication
ALTER TABLE public.users 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN password_last_updated timestamp with time zone DEFAULT now();

-- Create index for faster lookups
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.users when a user signs up
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    class,
    state,
    city,
    phone,
    access_key,
    username,
    total_study_time,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'access_key', ''),
    NULL,
    0,
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow viewing usernames and study times for leaderboard (public data only)
CREATE POLICY "Public leaderboard data" ON public.users
  FOR SELECT USING (username IS NOT NULL);

-- Allow new users to insert their profile after signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);