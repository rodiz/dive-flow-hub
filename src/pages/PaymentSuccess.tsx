import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      setStatus('error');
      return;
    }

    verifyPayment(transactionId);
  }, [searchParams]);

  const verifyPayment = async (transactionId: string) => {
    try {
      // Call the edge function to verify the payment
      const { data, error } = await supabase.functions.invoke('verify-wompi-payment', {
        body: { transactionId },
      });

      if (error) throw error;

      if (data.success) {
        setTransactionData(data.transactionData);
        
        if (data.status === 'APPROVED') {
          setStatus('success');
          toast({
            title: "¡Pago exitoso!",
            description: "Tu suscripción ha sido activada correctamente",
          });
        } else if (data.status === 'DECLINED' || data.status === 'ERROR') {
          setStatus('failed');
          toast({
            title: "Pago rechazado",
            description: "El pago no pudo ser procesado",
            variant: "destructive",
          });
        } else {
          setStatus('loading');
          // If still pending, check again in a few seconds
          setTimeout(() => verifyPayment(transactionId), 3000);
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      toast({
        title: "Error",
        description: "Error verificando el pago",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verificando pago...';
      case 'success':
        return '¡Pago exitoso!';
      case 'failed':
        return 'Pago rechazado';
      case 'error':
        return 'Error en el pago';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Estamos verificando tu pago. Esto puede tomar unos momentos.';
      case 'success':
        return 'Tu suscripción ha sido activada exitosamente. Ya puedes acceder a todas las funcionalidades.';
      case 'failed':
        return 'El pago no pudo ser procesado. Por favor, intenta nuevamente con otro método de pago.';
      case 'error':
        return 'Hubo un error al procesar tu pago. Si el problema persiste, contacta con soporte.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
          <CardDescription className="text-center">
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {transactionData && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Detalles de la transacción</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ID de transacción:</span>
                  <span className="font-mono">{transactionData.id}</span>
                </div>
                {transactionData.amount_in_cents && (
                  <div className="flex justify-between">
                    <span>Monto:</span>
                    <span className="font-medium">
                      {formatAmount(transactionData.amount_in_cents / 100)}
                    </span>
                  </div>
                )}
                {transactionData.reference && (
                  <div className="flex justify-between">
                    <span>Referencia:</span>
                    <span>{transactionData.reference}</span>
                  </div>
                )}
                {transactionData.created_at && (
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{new Date(transactionData.created_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {status === 'success' && (
              <>
                <Button onClick={() => navigate('/perfil?tab=subscription')} className="w-full">
                  Ver mi suscripción
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Ir al inicio
                </Button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <Button onClick={() => navigate('/perfil?tab=subscription')} className="w-full">
                  Intentar nuevamente
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Ir al inicio
                </Button>
              </>
            )}
            
            {status === 'error' && (
              <Button onClick={() => navigate('/')} className="w-full">
                Ir al inicio
              </Button>
            )}
            
            {status === 'loading' && (
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Continuar navegando
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}