-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for service types
CREATE TYPE public.service_type AS ENUM ('water', 'electricity');

-- Create enum for incident status
CREATE TYPE public.incident_status AS ENUM ('scheduled', 'ongoing', 'resolved');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create sectors table (zones géographiques de la ville)
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  coordinates JSONB NOT NULL, -- GeoJSON format pour la carte
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  service_type service_type NOT NULL,
  status incident_status NOT NULL DEFAULT 'ongoing',
  title TEXT NOT NULL,
  description TEXT,
  cause TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_end_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sectors (public read, admin write)
CREATE POLICY "Everyone can view sectors"
  ON public.sectors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sectors"
  ON public.sectors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for incidents (public read, admin write)
CREATE POLICY "Everyone can view incidents"
  ON public.incidents FOR SELECT
  USING (true);

CREATE POLICY "Admins can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update incidents"
  ON public.incidents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete incidents"
  ON public.incidents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample sectors (exemples de quartiers)
INSERT INTO public.sectors (name, description, coordinates) VALUES
  ('Centre-Ville', 'Quartier du centre-ville', '{"type":"Polygon","coordinates":[[[9.4526,-0.3940],[9.4580,-0.3940],[9.4580,-0.3890],[9.4526,-0.3890],[9.4526,-0.3940]]]}'),
  ('Akébé', 'Quartier Akébé', '{"type":"Polygon","coordinates":[[[9.4450,-0.4010],[9.4520,-0.4010],[9.4520,-0.3960],[9.4450,-0.3960],[9.4450,-0.4010]]]}'),
  ('Nombakélé', 'Quartier Nombakélé', '{"type":"Polygon","coordinates":[[[9.4580,-0.4000],[9.4650,-0.4000],[9.4650,-0.3950],[9.4580,-0.3950],[9.4580,-0.4000]]]}'),
  ('Lalala', 'Quartier Lalala', '{"type":"Polygon","coordinates":[[[9.4400,-0.3880],[9.4480,-0.3880],[9.4480,-0.3830],[9.4400,-0.3830],[9.4400,-0.3880]]]}'),
  ('Nzeng-Ayong', 'Quartier Nzeng-Ayong', '{"type":"Polygon","coordinates":[[[9.4650,-0.3920],[9.4730,-0.3920],[9.4730,-0.3870],[9.4650,-0.3870],[9.4650,-0.3920]]]}');

-- Enable realtime for incidents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;