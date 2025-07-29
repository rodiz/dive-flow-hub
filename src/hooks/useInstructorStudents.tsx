import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  city?: string;
  country?: string;
  role: string;
  certification_level?: string;
}

export interface InstructorStudent {
  id: string;
  instructor_id: string;
  student_id: string;
  student_email: string;
  student_name?: string;
  status: string;
  invited_at: string;
  notes?: string;
  profile?: StudentProfile;
}

export const useInstructorStudents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['instructor-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get instructor-student relationships
      const { data: instructorStudents, error: relationsError } = await supabase
        .from('instructor_students')
        .select('*, student_name')
        .eq('instructor_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (relationsError) throw relationsError;

      if (!instructorStudents || instructorStudents.length === 0) {
        return [];
      }

      // Get student IDs that are not null
      const studentIds = instructorStudents
        .map(rel => rel.student_id)
        .filter(Boolean);

      if (studentIds.length === 0) {
        return instructorStudents.map(rel => ({ ...rel, profile: null }));
      }

      // Get profiles for those students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const studentsWithProfiles = instructorStudents.map(studentRel => {
        const profile = profiles?.find(p => p.user_id === studentRel.student_id) || null;
        return {
          ...studentRel,
          profile
        };
      });

      return studentsWithProfiles as InstructorStudent[];
    },
    enabled: !!user?.id
  });
};