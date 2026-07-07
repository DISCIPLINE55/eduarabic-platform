
-- Fix handle_new_user: add explicit search_path, schema-qualify everything,
-- and guard against invalid role values to prevent "Database error saving new user"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _role public.user_role;
BEGIN
  -- Safely resolve role from metadata; fall back to 'student' on any invalid value
  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role;
  EXCEPTION WHEN invalid_text_representation OR others THEN
    _role := 'student'::public.user_role;
  END;

  INSERT INTO public.profiles (id, email, full_name, role, is_profile_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role,
    false
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email    = EXCLUDED.email,
      full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
      updated_at = now();

  RETURN NEW;
END;
$$;

-- Recreate trigger with schema-qualified function name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
