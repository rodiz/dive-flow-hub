import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentButtonProps {
  planId: string;
  children?: React.ReactNode;
}

export default function PaymentButton({ planId, children }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para realizar el pago",
          variant: "destructive",
        });
        return;
      }

      // Call the edge function to create a Wompi payment
      const { data, error } = await supabase.functions.invoke('create-wompi-payment', {
        body: {
          email: user.email,
          planId: planId,
        },
      });

      if (error) throw error;

      if (data.success && data.checkoutUrl) {
        // Redirect to Wompi checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Error creating payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading}>
      <CreditCard className="w-4 h-4 mr-2" />
      {loading ? 'Procesando...' : children || 'Suscribirse'}
    </Button>
  );
}