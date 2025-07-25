import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId } = await req.json();
    
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    console.log('Verifying Wompi transaction:', transactionId);

    // Check transaction status with Wompi
    const wompiResponse = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WOMPI_PRIVATE_KEY')}`,
      },
    });

    if (!wompiResponse.ok) {
      throw new Error('Failed to verify transaction with Wompi');
    }

    const wompiData = await wompiResponse.json();
    console.log('Wompi verification response:', wompiData);

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update subscription status based on Wompi response
    if (wompiData.data) {
      const status = wompiData.data.status;
      let subscriptionStatus = 'pending';
      
      if (status === 'APPROVED') {
        subscriptionStatus = 'paid';
      } else if (status === 'DECLINED' || status === 'ERROR') {
        subscriptionStatus = 'failed';
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: subscriptionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('wompi_transaction_id', transactionId);

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: wompiData.data?.status,
        transactionData: wompiData.data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});