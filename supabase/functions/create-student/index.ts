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
    
    console.log(`Creating/finding student: ${firstName} ${lastName} (${email})`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let authData = existingUsers.users.find(user => user.email === email.trim());

    if (!authData) {
      // Create new auth user
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: tempPassword,
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'student'
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      authData = newAuthData.user;
      console.log('New user created:', authData.id);
    } else {
      console.log('User already exists:', authData.id);
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', authData.id)
      .single();

    if (!existingProfile) {
      // Create profile only if it doesn't exist
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.id,
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
    } else {
      console.log('Profile already exists');
    }

    // Check if instructor-student relationship already exists
    const { data: existingRelation } = await supabaseAdmin
      .from('instructor_students')
      .select('id')
      .eq('instructor_id', instructorId)
      .eq('student_id', authData.id)
      .single();

    if (!existingRelation) {
      // Add to instructor's students
      const { error: relationError } = await supabaseAdmin
        .from('instructor_students')
        .insert({
          instructor_id: instructorId,
          student_id: authData.id,
          student_email: email.trim(),
          status: 'active'
        });

      if (relationError) {
        console.error('Relation error:', relationError);
        throw relationError;
      }
      console.log('Student-instructor relationship created');
    } else {
      console.log('Student-instructor relationship already exists');
    }

    console.log('Student-instructor relationship created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        student: authData,
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