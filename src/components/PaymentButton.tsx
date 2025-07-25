import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentButtonProps {
  planId: string;
  planName: string;
  price: number;
  description: string;
}

export default function PaymentButton({ planId, planName, price, description }: PaymentButtonProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  const WOMPI_LINK = "https://checkout.wompi.co/l/test_VPOS_rPnR1y";

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a record to track this payment attempt
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          email,
          plan_id: planId,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });

      if (error) {
        console.error('Error creating subscription record:', error);
      }

      // Open Wompi checkout in new tab
      const wompiUrl = `${WOMPI_LINK}?customer_email=${encodeURIComponent(email)}`;
      window.open(wompiUrl, '_blank');
      
      toast({
        title: "Redirigiendo a Wompi",
        description: "Se ha abierto una nueva pestaña. Completa el pago y regresa aquí.",
      });

      // Start polling for payment status
      setIsPolling(true);
      pollPaymentStatus(email);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (userEmail: string) => {
    const maxAttempts = 40; // 20 minutes max (30s intervals)
    let attempts = 0;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        toast({
          title: "Verificación de pago",
          description: "Tiempo de espera agotado. Actualiza la página para verificar tu pago.",
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, updated_at')
          .eq('email', userEmail)
          .eq('status', 'paid')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setIsPolling(false);
          toast({
            title: "¡Pago exitoso!",
            description: "Tu suscripción ha sido activada",
          });
          // Reload page to update subscription status
          setTimeout(() => window.location.reload(), 2000);
          return;
        }

        // Continue polling if no paid subscription found
        attempts++;
        setTimeout(checkStatus, 30000); // Check every 30 seconds
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        setTimeout(checkStatus, 30000);
      }
    };

    // Start checking after a short delay
    setTimeout(checkStatus, 10000); // Wait 10 seconds before first check
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {planName}
          <span className="text-primary">${price.toLocaleString()} COP</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handlePayment} 
          disabled={loading || !email || isPolling}
          className="w-full"
          variant="ocean"
        >
          {loading ? "Procesando..." : isPolling ? "Verificando pago..." : "Pagar con Wompi"}
        </Button>
        
        {isPolling && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm text-blue-800">
                Esperando confirmación del pago... Puedes cerrar esta pestaña después de pagar.
              </p>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Serás redirigido a Wompi para completar el pago de forma segura
        </p>
      </CardContent>
    </Card>
  );
}