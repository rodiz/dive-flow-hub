import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaymentButton from "./PaymentButton";

interface Subscription {
  id: string;
  email: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  subscription_plans: {
    name: string;
    description?: string;
    price_cop: number;
    interval_days: number;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_cop: number;
  interval_days: number;
  active: boolean;
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            description,
            price_cop,
            interval_days
          )
        `)
        .eq('email', user.email)
        .eq('status', 'paid')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      } else {
        setSubscription(subscriptionData);
      }

      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_cop', { ascending: true });

      if (plansError) {
        console.error('Error fetching plans:', plansError);
      } else {
        setPlans(plansData || []);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de suscripción",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgressPercentage = (startsAt: string, expiresAt: string) => {
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(expiresAt);
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  if (subscription) {
    const daysRemaining = getDaysRemaining(subscription.expires_at);
    const progress = getProgressPercentage(subscription.starts_at, subscription.expires_at);
    const isExpiringSoon = daysRemaining <= 7;

    return (
      <div className="space-y-6">
        <Card className={`border-l-4 ${isExpiringSoon ? 'border-l-orange-500' : 'border-l-green-500'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {subscription.subscription_plans.name}
                </CardTitle>
                <CardDescription>
                  Suscripción activa hasta {new Date(subscription.expires_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className={isExpiringSoon ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                {isExpiringSoon ? 'Próximo a vencer' : 'Activa'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tiempo restante</span>
                <span className="text-sm text-muted-foreground">
                  {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {isExpiringSoon && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  Tu suscripción vence pronto. Renueva para continuar disfrutando del servicio.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Precio:</span>
                <p>{formatPrice(subscription.subscription_plans.price_cop)}</p>
              </div>
              <div>
                <span className="font-medium">Duración:</span>
                <p>{subscription.subscription_plans.interval_days} días</p>
              </div>
            </div>

            {subscription.subscription_plans.description && (
              <div>
                <span className="font-medium text-sm">Descripción:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.subscription_plans.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isExpiringSoon && plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Renovar Suscripción</CardTitle>
              <CardDescription>
                Selecciona un plan para renovar tu suscripción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      <p className="text-lg font-bold mt-1">{formatPrice(plan.price_cop)}</p>
                    </div>
                    <PaymentButton planId={plan.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin Suscripción Activa</h3>
          <p className="text-muted-foreground mb-6">
            Suscríbete para acceder a todas las funcionalidades de la plataforma
          </p>
        </CardContent>
      </Card>

      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Planes Disponibles</CardTitle>
            <CardDescription>
              Elige el plan que mejor se adapte a tus necesidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {plan.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{formatPrice(plan.price_cop)}</div>
                        <div className="text-sm text-muted-foreground">
                          por {plan.interval_days} días
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Válido por {plan.interval_days} días</span>
                      </div>
                      <PaymentButton planId={plan.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}