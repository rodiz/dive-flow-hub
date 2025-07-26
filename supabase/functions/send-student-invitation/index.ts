import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, notes, instructorId } = await req.json();
    
    if (!email || !instructorId) {
      throw new Error('Email and instructor ID are required');
    }

    console.log('Sending student invitation to:', email);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate invitation token
    const token = crypto.randomUUID();

    // Check if student already exists in the system
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('email', email)
      .eq('role', 'student')
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Get instructor info
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('first_name, last_name, business_name')
      .eq('user_id', instructorId)
      .single();

    if (instructorError) throw instructorError;

    let instructorName = instructor.business_name || 
                        `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();

    if (existingProfile) {
      // Student exists, add them directly to instructor_students
      const { error: insertError } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: instructorId,
          student_id: existingProfile.user_id,
          student_email: email,
          status: 'active',
          notes: notes || null
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          throw new Error('Este estudiante ya está en tu lista');
        }
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Estudiante agregado exitosamente',
          studentExists: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Student doesn't exist, create invitation
      const { error: inviteError } = await supabase
        .from('student_invitations')
        .insert({
          instructor_id: instructorId,
          email: email,
          token: token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (inviteError) {
        if (inviteError.code === '23505') { // Unique constraint violation
          throw new Error('Ya has enviado una invitación a este email');
        }
        throw inviteError;
      }

      // Add to instructor_students with pending status
      const { error: insertError } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: instructorId,
          student_id: null,
          student_email: email,
          status: 'invited',
          notes: notes || null
        });

      if (insertError) throw insertError;

      // Here you would normally send an email invitation
      // For now, we'll just log it and return success
      console.log(`Invitation would be sent to ${email} with token: ${token}`);
      console.log(`Invitation link: ${Deno.env.get('SITE_URL')}/registro?token=${token}`);

      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Resend
      // - etc.

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Invitación enviada exitosamente',
          token: token, // In production, don't return the token
          studentExists: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Error in student invitation:', error);
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