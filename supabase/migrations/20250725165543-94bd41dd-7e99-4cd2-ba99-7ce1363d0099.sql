-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cop INTEGER NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscriptions table  
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  wompi_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (active = true);

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plan
INSERT INTO public.subscription_plans (name, price_cop, description) 
VALUES ('Plan Mensual', 60000, 'Acceso completo a la aplicación por 30 días');

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE email = user_email 
    AND status = 'paid' 
    AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;