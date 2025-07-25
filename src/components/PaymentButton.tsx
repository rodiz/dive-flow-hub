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
  const { toast } = useToast();

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
      console.log('Creating Wompi payment for:', { email, planId });
      
      const { data, error } = await supabase.functions.invoke('create-wompi-payment', {
        body: { email, planId }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      console.log('Payment creation response:', data);

      if (data.success && data.checkoutUrl) {
        // Open Wompi checkout in new tab
        window.open(data.checkoutUrl, '_blank');
        
        toast({
          title: "Redirigiendo a Wompi",
          description: "Se ha abierto una nueva pestaña para completar el pago",
        });

        // Start verification polling
        if (data.transactionId) {
          pollTransactionStatus(data.transactionId);
        }
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
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

  const pollTransactionStatus = async (transactionId: string) => {
    const maxAttempts = 20; // 10 minutes max
    let attempts = 0;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        toast({
          title: "Verificación de pago",
          description: "Por favor verifica manualmente el estado de tu pago",
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-wompi-payment', {
          body: { transactionId }
        });

        if (error) {
          console.error('Verification error:', error);
          return;
        }

        console.log('Transaction status:', data);

        if (data.status === 'APPROVED') {
          toast({
            title: "¡Pago exitoso!",
            description: "Tu suscripción ha sido activada",
          });
          // Reload page to update subscription status
          window.location.reload();
          return;
        } else if (data.status === 'DECLINED' || data.status === 'ERROR') {
          toast({
            title: "Pago rechazado",
            description: "Tu pago no pudo ser procesado",
            variant: "destructive",
          });
          return;
        }

        // Continue polling if still pending
        attempts++;
        setTimeout(checkStatus, 30000); // Check every 30 seconds
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        setTimeout(checkStatus, 30000);
      }
    };

    // Start checking after a short delay
    setTimeout(checkStatus, 5000);
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
          disabled={loading || !email}
          className="w-full"
          variant="ocean"
        >
          {loading ? "Procesando..." : "Pagar con Wompi"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Serás redirigido a Wompi para completar el pago de forma segura
        </p>
      </CardContent>
    </Card>
  );
}