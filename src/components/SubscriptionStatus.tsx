import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";

interface Subscription {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  plan: {
    name: string;
    price_cop: number;
  };
}

interface SubscriptionStatusProps {
  userEmail?: string;
}

export default function SubscriptionStatus({ userEmail }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userEmail) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const fetchSubscription = async () => {
    if (!userEmail) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, price_cop)
        `)
        .eq('email', userEmail)
        .eq('status', 'paid')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Subscription fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Activa</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="destructive">Inactiva</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expireDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Cargando estado de suscripción...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            Sin Suscripción Activa
          </CardTitle>
          <CardDescription>
            No tienes una suscripción activa. Suscríbete para acceder a todas las funciones.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isExpiring = isExpiringSoon(subscription.expires_at);

  return (
    <Card className={isExpiring ? "border-yellow-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription.status)}
            Suscripción {subscription.plan.name}
          </div>
          {getStatusBadge(subscription.status)}
        </CardTitle>
        <CardDescription>
          ${subscription.plan.price_cop.toLocaleString()} COP/mes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4" />
          <span>Vence el {formatDate(subscription.expires_at)}</span>
        </div>
        
        {isExpiring && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Tu suscripción vence pronto. Renueva para continuar disfrutando del servicio.
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSubscription}
          className="w-full"
        >
          Actualizar Estado
        </Button>
      </CardContent>
    </Card>
  );
}