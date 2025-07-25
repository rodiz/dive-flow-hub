import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
    
    if (transactionId) {
      verifyPayment(transactionId);
    } else {
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyPayment = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-wompi-payment', {
        body: { transactionId }
      });

      if (!error && data.success && data.status === 'APPROVED') {
        setVerified(true);
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold">Verificando pago...</h2>
              <p className="text-muted-foreground">
                Estamos confirmando tu transacción con Wompi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {verified ? "¡Pago Exitoso!" : "Pago Procesado"}
          </CardTitle>
          <CardDescription>
            {verified 
              ? "Tu suscripción ha sido activada correctamente"
              : "Tu pago está siendo procesado. Recibirás una confirmación por email."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ Suscripción activa - Ya puedes acceder a todas las funciones de DiveLog Pro
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                <User className="w-4 h-4 mr-2" />
                Ir al Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Si tienes algún problema, contáctanos a soporte@divelog.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}