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
    const { email, planId } = await req.json();
    
    if (!email || !planId) {
      throw new Error('Email and planId are required');
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Create Wompi transaction
    const wompiPayload = {
      acceptance_token: "acceptance_token_generated_previously", // In production, generate this properly
      amount_in_cents: plan.price_cop * 100, // Wompi expects cents
      currency: "COP",
      customer_email: email,
      reference: `subscription_${crypto.randomUUID()}`,
      customer_data: {
        phone_number: "+57000000000", // Optional default
        full_name: email.split('@')[0], // Use email prefix as default name
      },
      redirect_url: `${req.headers.get('origin')}/payment-success`,
    };

    console.log('Creating Wompi transaction:', wompiPayload);

    const wompiResponse = await fetch('https://sandbox.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('WOMPI_PRIVATE_KEY')}`,
      },
      body: JSON.stringify(wompiPayload),
    });

    if (!wompiResponse.ok) {
      const errorText = await wompiResponse.text();
      console.error('Wompi API Error:', errorText);
      throw new Error(`Wompi API Error: ${errorText}`);
    }

    const wompiData = await wompiResponse.json();
    console.log('Wompi response:', wompiData);

    if (wompiData.data && wompiData.data.id) {
      // Create subscription record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.interval_days);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          email,
          plan_id: planId,
          wompi_transaction_id: wompiData.data.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

      if (subError) {
        console.error('Subscription creation error:', subError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: wompiData.data?.id,
        checkoutUrl: wompiData.data?.payment_method?.checkout_url || null,
        wompiData,
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