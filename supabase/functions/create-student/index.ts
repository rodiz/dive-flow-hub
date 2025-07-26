import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { firstName, lastName, email, phone, city, instructorId } = await req.json();

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    console.log(`Creating student: ${firstName} ${lastName} (${email})`);

    // Create auth user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'student'
      },
      email_confirm: true // Auto-confirm email to skip verification
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created successfully:', authData.user.id);

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        role: 'student'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    console.log('Profile created successfully');

    // Add to instructor's students
    const { error: relationError } = await supabaseAdmin
      .from('instructor_students')
      .insert({
        instructor_id: instructorId,
        student_id: authData.user.id,
        student_email: email.trim(),
        status: 'active'
      });

    if (relationError) {
      console.error('Relation error:', relationError);
      throw relationError;
    }

    console.log('Student-instructor relationship created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        student: authData.user,
        tempPassword 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-student function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error creating student',
        details: error 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});