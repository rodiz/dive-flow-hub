import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiveAnalysis {
  totalDives: number;
  averageDepth: number;
  averageBottomTime: number;
  progressionRate: number;
  skillsMastery: { [key: string]: number };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  safetyScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, courseId } = await req.json();
    
    if (!studentId || !courseId) {
      throw new Error('Student ID and Course ID are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch student's dives for the course
    const { data: dives, error: divesError } = await supabase
      .from('dives')
      .select(`
        *,
        dive_sites!inner(name, max_depth, difficulty_level)
      `)
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('dive_date', { ascending: true });

    if (divesError) throw divesError;

    // Fetch student's medical records for safety assessment
    const { data: medicalRecords, error: medicalError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (medicalError) throw medicalError;

    // Fetch course enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        courses!inner(name, certification_agency, min_dives_required, max_depth_limit)
      `)
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) throw enrollmentError;

    // Perform AI analysis
    const analysis = analyzeStudentProgress(dives, medicalRecords[0], enrollment);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        divesAnalyzed: dives.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in AI analysis:', error);
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

function analyzeStudentProgress(dives: any[], medicalRecord: any, enrollment: any): DiveAnalysis {
  if (!dives || dives.length === 0) {
    return {
      totalDives: 0,
      averageDepth: 0,
      averageBottomTime: 0,
      progressionRate: 0,
      skillsMastery: {},
      strengths: ['Estudiante motivado para comenzar'],
      improvements: ['Completar las primeras inmersiones'],
      recommendations: ['Comenzar con inmersiones en aguas protegidas', 'Enfocarse en habilidades básicas'],
      safetyScore: 8
    };
  }

  const totalDives = dives.length;
  const averageDepth = dives.reduce((sum, dive) => sum + (dive.depth_achieved || 0), 0) / totalDives;
  const averageBottomTime = dives.reduce((sum, dive) => sum + (dive.bottom_time || 0), 0) / totalDives;

  // Calculate progression rate based on depth and time improvements
  const firstDive = dives[0];
  const lastDive = dives[dives.length - 1];
  const depthProgression = lastDive.depth_achieved - firstDive.depth_achieved;
  const timeProgression = lastDive.bottom_time - firstDive.bottom_time;
  const progressionRate = Math.min(100, Math.max(0, (depthProgression + timeProgression) / totalDives * 10));

  // Analyze skills mastery based on dive progression
  const skillsMastery = analyzeSkillsMastery(dives, enrollment.courses);

  // Generate strengths and improvements
  const { strengths, improvements } = generateStrengthsAndImprovements(dives, skillsMastery, enrollment.courses);

  // Generate personalized recommendations
  const recommendations = generateRecommendations(dives, skillsMastery, enrollment.courses, medicalRecord);

  // Calculate safety score
  const safetyScore = calculateSafetyScore(dives, medicalRecord);

  return {
    totalDives,
    averageDepth: Math.round(averageDepth * 100) / 100,
    averageBottomTime: Math.round(averageBottomTime),
    progressionRate: Math.round(progressionRate),
    skillsMastery,
    strengths,
    improvements,
    recommendations,
    safetyScore
  };
}

function analyzeSkillsMastery(dives: any[], course: any): { [key: string]: number } {
  const skills = {
    'Flotabilidad': 0,
    'Navegación': 0,
    'Comunicación': 0,
    'Manejo de Equipo': 0,
    'Procedimientos de Seguridad': 0,
    'Adaptación al Entorno': 0
  };

  dives.forEach((dive, index) => {
    const diveFactor = (index + 1) / dives.length; // Weight later dives more
    const depthFactor = Math.min(dive.depth_achieved / 18, 1); // Normalize to 18m max
    const timeFactor = Math.min(dive.bottom_time / 45, 1); // Normalize to 45min max

    // Buoyancy improves with consistent depth control and longer bottom times
    skills['Flotabilidad'] += (depthFactor * timeFactor * diveFactor * 20);

    // Navigation improves with varied dive sites and successful dives
    if (dive.dive_sites?.difficulty_level) {
      skills['Navegación'] += (dive.dive_sites.difficulty_level * diveFactor * 15);
    }

    // Communication assumed good if medical and equipment checks are done
    if (dive.medical_check && dive.equipment_check) {
      skills['Comunicación'] += (diveFactor * 25);
    }

    // Equipment handling improves with equipment checks and no issues
    if (dive.equipment_check) {
      skills['Manejo de Equipo'] += (diveFactor * 20);
    }

    // Safety procedures based on proper checks and conservative diving
    const conservativeDiving = dive.depth_achieved <= (dive.dive_sites?.max_depth * 0.8);
    if (dive.medical_check && dive.equipment_check && conservativeDiving) {
      skills['Procedimientos de Seguridad'] += (diveFactor * 20);
    }

    // Environment adaptation based on varied conditions and sites
    if (dive.visibility && dive.water_temperature) {
      skills['Adaptación al Entorno'] += (diveFactor * 15);
    }
  });

  // Normalize skills to 0-100 scale
  Object.keys(skills).forEach(skill => {
    skills[skill] = Math.min(100, Math.round(skills[skill]));
  });

  return skills;
}

function generateStrengthsAndImprovements(dives: any[], skills: any, course: any): { strengths: string[], improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Analyze strengths based on skills mastery
  Object.entries(skills).forEach(([skill, level]) => {
    if (level >= 80) {
      strengths.push(`Excelente dominio en ${skill.toLowerCase()}`);
    } else if (level < 50) {
      improvements.push(`Mejorar habilidades en ${skill.toLowerCase()}`);
    }
  });

  // Analyze dive patterns
  const consistentDiving = dives.length >= 3;
  const progressiveDepth = dives.some((dive, i) => 
    i > 0 && dive.depth_achieved > dives[i-1].depth_achieved
  );

  if (consistentDiving) {
    strengths.push('Consistencia en la práctica de buceo');
  }

  if (progressiveDepth) {
    strengths.push('Progresión gradual en profundidad');
  }

  // Check for areas needing improvement
  const averageDepth = dives.reduce((sum, dive) => sum + dive.depth_achieved, 0) / dives.length;
  const maxCourseDepth = course.max_depth_limit || 18;

  if (averageDepth < maxCourseDepth * 0.6) {
    improvements.push('Ganar confianza para inmersiones más profundas');
  }

  const equipmentIssues = dives.some(dive => !dive.equipment_check);
  if (equipmentIssues) {
    improvements.push('Ser más consistente con las verificaciones de equipo');
  }

  return { strengths, improvements };
}

function generateRecommendations(dives: any[], skills: any, course: any, medicalRecord: any): string[] {
  const recommendations: string[] = [];

  // Based on skills mastery
  if (skills['Flotabilidad'] < 70) {
    recommendations.push('Practicar ejercicios de flotabilidad neutra en aguas protegidas');
  }

  if (skills['Navegación'] < 70) {
    recommendations.push('Realizar inmersiones con brújula y práctica de navegación natural');
  }

  // Based on dive progression
  const totalDives = dives.length;
  const requiredDives = course.min_dives_required || 4;

  if (totalDives < requiredDives) {
    recommendations.push(`Completar ${requiredDives - totalDives} inmersiones adicionales para certificación`);
  }

  // Based on medical status
  if (medicalRecord && medicalRecord.fitness_level < 7) {
    recommendations.push('Considerar mejorar la condición física para buceo más cómodo');
  }

  // Based on dive variety
  const uniqueSites = new Set(dives.map(dive => dive.dive_site_id)).size;
  if (uniqueSites < 2 && totalDives >= 3) {
    recommendations.push('Explorar diferentes sitios de buceo para mayor experiencia');
  }

  // Safety recommendations
  const hasDeepDives = dives.some(dive => dive.depth_achieved > 15);
  if (hasDeepDives && skills['Procedimientos de Seguridad'] < 80) {
    recommendations.push('Revisar procedimientos de seguridad para inmersiones profundas');
  }

  // General progression
  if (totalDives >= requiredDives && Object.values(skills).every(skill => skill >= 70)) {
    recommendations.push('¡Excelente progreso! Considera cursos de especialidad avanzada');
  }

  return recommendations;
}

function calculateSafetyScore(dives: any[], medicalRecord: any): number {
  let score = 100;

  // Deduct for missing safety checks
  const missedEquipmentChecks = dives.filter(dive => !dive.equipment_check).length;
  const missedMedicalChecks = dives.filter(dive => !dive.medical_check).length;
  
  score -= (missedEquipmentChecks * 5);
  score -= (missedMedicalChecks * 5);

  // Deduct for unsafe diving practices
  const unsafeDives = dives.filter(dive => {
    const siteMaxDepth = dive.dive_sites?.max_depth || 30;
    return dive.depth_achieved > siteMaxDepth * 0.9; // Too close to max depth
  }).length;

  score -= (unsafeDives * 10);

  // Consider medical fitness
  if (medicalRecord && medicalRecord.fitness_level < 5) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}