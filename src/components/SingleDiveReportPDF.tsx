import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DiveData {
  id: string;
  dive_date: string;
  dive_time: string;
  depth_achieved: number;
  bottom_time: number;
  dive_sites: {
    name: string;
    location: string;
  };
  dive_participants: Array<{
    depth_achieved: number;
    bottom_time: number;
    performance_rating: number;
    individual_notes: string;
    images: string[];
    videos: string[];
    wetsuit_thickness?: number;
    gas_mix?: string;
    visibility_conditions?: number;
    water_temperature?: number;
    current_strength?: number;
    safety_stop_time?: number;
    tank_pressure_start?: number;
    tank_pressure_end?: number;
    oxygen_amount?: number;
    ballast_weight?: number;
    equipment_check?: boolean;
    medical_check?: boolean;
    skills_completed?: any;
  }>;
  photos: string[];
  videos: string[];
  instructor?: {
    first_name: string;
    last_name: string;
  };
  diving_center?: {
    name: string;
  };
}

interface SingleDiveReportPDFProps {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    certification_level?: string;
  };
  dive: DiveData;
  studentMediaFiles: { url: string; name: string; type: 'image' | 'video' }[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 15,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8
  },
  title: {
    fontSize: 24,
    color: '#1e40af',
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fefefe',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  label: {
    fontSize: 10,
    color: '#374151',
    width: '30%'
  },
  value: {
    fontSize: 10,
    color: '#111827',
    width: '70%'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 5,
    width: '23%',
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    color: '#1e40af',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center'
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  conditionBox: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 4,
    width: '48%',
    marginBottom: 5,
    marginRight: '2%'
  },
  conditionLabel: {
    fontSize: 8,
    color: '#0369a1',
    marginBottom: 2
  },
  conditionValue: {
    fontSize: 10,
    color: '#1e293b'
  },
  equipmentSection: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15
  },
  equipmentTitle: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 8
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  equipmentItem: {
    width: '50%',
    marginBottom: 5
  },
  skillsSection: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15
  },
  skillsTitle: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 8
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  skillStatus: {
    fontSize: 8,
    width: 12,
    height: 12,
    backgroundColor: '#22c55e',
    borderRadius: 2,
    marginRight: 8,
    textAlign: 'center',
    color: 'white'
  },
  skillName: {
    fontSize: 9,
    color: '#374151'
  },
  performanceBox: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    borderLeft: '4 solid #22c55e',
    marginBottom: 15
  },
  performanceTitle: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 8
  },
  performanceRating: {
    fontSize: 24,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 5
  },
  performanceDesc: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center'
  },
  notesSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15
  },
  notesTitle: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 8
  },
  notesText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4
  },
  mediaSection: {
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15
  },
  mediaTitle: {
    fontSize: 12,
    color: '#7c3aed',
    marginBottom: 8
  },
  mediaCount: {
    fontSize: 10,
    color: '#374151'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10
  }
});

export const SingleDiveReportPDF: React.FC<SingleDiveReportPDFProps> = ({
  student,
  dive,
  studentMediaFiles
}) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: es });
  const diveDate = format(new Date(dive.dive_date), 'dd MMMM yyyy', { locale: es });
  const participant = dive.dive_participants[0] || {
    depth_achieved: 0,
    bottom_time: 0,
    performance_rating: 0,
    individual_notes: '',
    images: [],
    videos: [],
    wetsuit_thickness: undefined,
    gas_mix: 'Aire',
    visibility_conditions: undefined,
    water_temperature: undefined,
    current_strength: undefined,
    safety_stop_time: undefined,
    tank_pressure_start: undefined,
    tank_pressure_end: undefined,
    oxygen_amount: undefined,
    ballast_weight: undefined,
    equipment_check: false,
    medical_check: false,
    skills_completed: {}
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 8) return '#059669';
    if (rating >= 6) return '#d97706';
    return '#dc2626';
  };

  const getPerformanceText = (rating: number) => {
    if (rating >= 9) return 'Excelente';
    if (rating >= 8) return 'Muy Bueno';
    if (rating >= 7) return 'Bueno';
    if (rating >= 6) return 'Satisfactorio';
    if (rating >= 5) return 'Regular';
    return 'Necesita Mejora';
  };

  const getConditionText = (value: number, type: string) => {
    if (type === 'visibility') {
      if (value >= 15) return 'Excelente';
      if (value >= 10) return 'Buena';
      if (value >= 5) return 'Regular';
      return 'Pobre';
    }
    if (type === 'current') {
      if (value <= 1) return 'Mínima';
      if (value <= 2) return 'Ligera';
      if (value <= 3) return 'Moderada';
      return 'Fuerte';
    }
    return value.toString();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            REPORTE DE INMERSIÓN INDIVIDUAL
          </Text>
          <Text style={styles.subtitle}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.subtitle}>
            {diveDate} - {dive.dive_sites.name}
          </Text>
          <Text style={styles.subtitle}>
            Generado el {currentDate}
          </Text>
        </View>

        {/* Información del Estudiante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 INFORMACIÓN DEL BUCEADOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{student.first_name} {student.last_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>
          {student.certification_level && (
            <View style={styles.row}>
              <Text style={styles.label}>Certificación:</Text>
              <Text style={styles.value}>{student.certification_level}</Text>
            </View>
          )}
          {dive.instructor && (
            <View style={styles.row}>
              <Text style={styles.label}>Instructor:</Text>
              <Text style={styles.value}>{dive.instructor.first_name} {dive.instructor.last_name}</Text>
            </View>
          )}
          {dive.diving_center && (
            <View style={styles.row}>
              <Text style={styles.label}>Centro de Buceo:</Text>
              <Text style={styles.value}>{dive.diving_center.name}</Text>
            </View>
          )}
        </View>

        {/* Detalles de la Inmersión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌊 DETALLES DE LA INMERSIÓN</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{participant.depth_achieved || dive.depth_achieved}m</Text>
              <Text style={styles.statLabel}>Profundidad Alcanzada</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{participant.bottom_time || dive.bottom_time}min</Text>
              <Text style={styles.statLabel}>Tiempo de Fondo</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{dive.dive_time || 'N/A'}</Text>
              <Text style={styles.statLabel}>Hora de Inmersión</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{participant.safety_stop_time || 'N/A'}min</Text>
              <Text style={styles.statLabel}>Parada de Seguridad</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Sitio de Buceo:</Text>
            <Text style={styles.value}>{dive.dive_sites.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ubicación:</Text>
            <Text style={styles.value}>{dive.dive_sites.location}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mezcla de Gas:</Text>
            <Text style={styles.value}>{participant.gas_mix || 'Aire'}</Text>
          </View>
        </View>

        {/* Condiciones del Buceo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌡️ CONDICIONES AMBIENTALES</Text>
          <View style={styles.conditionsGrid}>
            {participant.water_temperature && (
              <View style={styles.conditionBox}>
                <Text style={styles.conditionLabel}>Temperatura del Agua</Text>
                <Text style={styles.conditionValue}>{participant.water_temperature}°C</Text>
              </View>
            )}
            {participant.visibility_conditions && (
              <View style={styles.conditionBox}>
                <Text style={styles.conditionLabel}>Visibilidad</Text>
                <Text style={styles.conditionValue}>
                  {participant.visibility_conditions}m - {getConditionText(participant.visibility_conditions, 'visibility')}
                </Text>
              </View>
            )}
            {participant.current_strength !== undefined && (
              <View style={styles.conditionBox}>
                <Text style={styles.conditionLabel}>Corriente</Text>
                <Text style={styles.conditionValue}>
                  Nivel {participant.current_strength} - {getConditionText(participant.current_strength, 'current')}
                </Text>
              </View>
            )}
            {participant.wetsuit_thickness && (
              <View style={styles.conditionBox}>
                <Text style={styles.conditionLabel}>Grosor del Traje</Text>
                <Text style={styles.conditionValue}>{participant.wetsuit_thickness}mm</Text>
              </View>
            )}
          </View>
        </View>

        {/* Equipamiento */}
        <View style={styles.equipmentSection}>
          <Text style={styles.equipmentTitle}>⚙️ EQUIPAMIENTO Y TÉCNICA</Text>
          <View style={styles.equipmentGrid}>
            {participant.tank_pressure_start && (
              <View style={styles.equipmentItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Presión Inicial:</Text>
                  <Text style={styles.value}>{participant.tank_pressure_start} bar</Text>
                </View>
              </View>
            )}
            {participant.tank_pressure_end && (
              <View style={styles.equipmentItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Presión Final:</Text>
                  <Text style={styles.value}>{participant.tank_pressure_end} bar</Text>
                </View>
              </View>
            )}
            {participant.ballast_weight && (
              <View style={styles.equipmentItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Peso de Lastre:</Text>
                  <Text style={styles.value}>{participant.ballast_weight} kg</Text>
                </View>
              </View>
            )}
            {participant.oxygen_amount && (
              <View style={styles.equipmentItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Oxígeno:</Text>
                  <Text style={styles.value}>{participant.oxygen_amount}%</Text>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Chequeo de Equipo:</Text>
            <Text style={styles.value}>{participant.equipment_check ? '✓ Completado' : '✗ No Realizado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chequeo Médico:</Text>
            <Text style={styles.value}>{participant.medical_check ? '✓ Completado' : '✗ No Realizado'}</Text>
          </View>
        </View>

        {/* Rendimiento */}
        {participant.performance_rating && (
          <View style={styles.performanceBox}>
            <Text style={styles.performanceTitle}>🏆 EVALUACIÓN DEL RENDIMIENTO</Text>
            <Text style={[styles.performanceRating, { color: getPerformanceColor(participant.performance_rating) }]}>
              {participant.performance_rating}/10
            </Text>
            <Text style={styles.performanceDesc}>
              {getPerformanceText(participant.performance_rating)}
            </Text>
          </View>
        )}

        {/* Habilidades Completadas */}
        {participant.skills_completed && Object.keys(participant.skills_completed).length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>✅ HABILIDADES EVALUADAS</Text>
            {Object.entries(participant.skills_completed).map(([skill, completed], index) => (
              <View key={index} style={styles.skillItem}>
                <Text style={[styles.skillStatus, { backgroundColor: completed ? '#22c55e' : '#ef4444' }]}>
                  {completed ? '✓' : '✗'}
                </Text>
                <Text style={styles.skillName}>{skill}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notas del Instructor */}
        {participant.individual_notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>📝 OBSERVACIONES DEL INSTRUCTOR</Text>
            <Text style={styles.notesText}>{participant.individual_notes}</Text>
          </View>
        )}

        {/* Multimedia */}
        {studentMediaFiles.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>📷 MULTIMEDIA DE LA INMERSIÓN</Text>
            <Text style={styles.mediaCount}>
              Total de archivos: {studentMediaFiles.length}
            </Text>
            <Text style={styles.mediaCount}>
              Imágenes: {studentMediaFiles.filter(f => f.type === 'image').length}
            </Text>
            <Text style={styles.mediaCount}>
              Videos: {studentMediaFiles.filter(f => f.type === 'video').length}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Reporte generado automáticamente el {currentDate} | Sistema de Gestión de Buceo
        </Text>
      </Page>
    </Document>
  );
};