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
    const payload = await req.json();
    console.log('Wompi webhook received:', JSON.stringify(payload, null, 2));

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate webhook signature (optional for test environment)
    const signature = req.headers.get('wompi-signature');
    console.log('Webhook signature:', signature);

    // Process the webhook based on event type
    if (payload.event === 'transaction.updated') {
      const transaction = payload.data?.transaction;
      
      if (transaction) {
        console.log('Processing transaction:', {
          id: transaction.id,
          status: transaction.status,
          amount_in_cents: transaction.amount_in_cents,
          customer_email: transaction.customer_email
        });

        // Map Wompi status to our subscription status
        let subscriptionStatus = 'pending';
        if (transaction.status === 'APPROVED') {
          subscriptionStatus = 'paid';
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
          subscriptionStatus = 'failed';
        }

        // Check if subscription already exists
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('wompi_transaction_id', transaction.id)
          .single();

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              status: subscriptionStatus,
              updated_at: new Date().toISOString()
            })
            .eq('wompi_transaction_id', transaction.id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
          } else {
            console.log('Subscription updated successfully');
          }
        } else if (subscriptionStatus === 'paid' && transaction.customer_email) {
          // Create new subscription for approved payments
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('active', true)
            .single();

          if (plan) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + plan.interval_days);

            const { error: insertError } = await supabase
              .from('subscriptions')
              .insert({
                email: transaction.customer_email,
                plan_id: plan.id,
                wompi_transaction_id: transaction.id,
                status: subscriptionStatus,
                expires_at: expiresAt.toISOString(),
              });

            if (insertError) {
              console.error('Error creating subscription:', insertError);
            } else {
              console.log('New subscription created successfully');
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});