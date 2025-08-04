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
  const { user, userProfile } = useAuth();

  return useQuery({
    queryKey: ['instructor-students', user?.id, userProfile?.role],
    queryFn: async () => {
      console.log('🔍 useInstructorStudents - Starting query', { userId: user?.id, role: userProfile?.role });
      if (!user?.id) return [];

      let instructorStudents;

      if (userProfile?.role === 'diving_center') {
        console.log('🏢 Querying as diving center');
        // For diving centers, get students from all their instructors
        const { data: instructorAssignments, error: assignmentError } = await supabase
          .from('instructor_assignments')
          .select('instructor_id')
          .eq('diving_center_id', user.id)
          .eq('assignment_status', 'active');

        console.log('👨‍🏫 Instructor assignments:', { instructorAssignments, assignmentError });

        const instructorIds = instructorAssignments?.map(ia => ia.instructor_id) || [];
        console.log('📋 Instructor IDs:', instructorIds);
        
        if (instructorIds.length === 0) {
          console.log('❌ No instructors found for diving center');
          return [];
        }

        const { data, error: relationsError } = await supabase
          .from('instructor_students')
          .select('*')
          .in('instructor_id', instructorIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        console.log('👥 Students query result (diving center):', { data, relationsError, instructorIds });
        if (relationsError) throw relationsError;
        instructorStudents = data;
      } else {
        console.log('👨‍🏫 Querying as instructor');
        // For instructors, get only their students
        const { data, error: relationsError } = await supabase
          .from('instructor_students')
          .select('*')
          .eq('instructor_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        console.log('👥 Students query result (instructor):', { data, relationsError, instructorId: user.id });
        if (relationsError) throw relationsError;
        instructorStudents = data;
      }

      console.log('📊 Final instructor students:', instructorStudents);
      
      if (!instructorStudents || instructorStudents.length === 0) {
        console.log('❌ No students found, returning empty array');
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

      console.log('✅ Final result with profiles:', studentsWithProfiles);
      return studentsWithProfiles as InstructorStudent[];
    },
    enabled: !!user?.id && !!userProfile?.role,
    refetchOnWindowFocus: true,
    staleTime: 0 // Always refetch
  });
};