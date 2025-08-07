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
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#0ea5e9',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fefefe',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    width: 120,
  },
  value: {
    fontSize: 10,
    color: '#1e293b',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    width: '23%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  conditionBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    marginBottom: 8,
    marginRight: '2%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  conditionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 3,
  },
  conditionValue: {
    fontSize: 10,
    color: '#1e293b',
  },
  equipmentSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  equipmentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
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
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  skillsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
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
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    marginBottom: 15,
  },
  performanceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
  },
  performanceRating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 5,
  },
  performanceDesc: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  notesSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
  mediaSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  mediaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
  },
  mediaCount: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
  },
  mediaInfo: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  mediaFileUrl: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
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
    if (rating >= 4) return '#059669';
    if (rating >= 3) return '#d97706';
    return '#dc2626';
  };

  const getPerformanceText = (rating: number) => {
    if (rating >= 5) return 'Excelente';
    if (rating >= 4) return 'Muy Bueno';
    if (rating >= 3) return 'Bueno';
    if (rating >= 2) return 'Satisfactorio';
    if (rating >= 1) return 'Regular';
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
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL BUCEADOR</Text>
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
          <Text style={styles.sectionTitle}>DETALLES DE LA INMERSIÓN</Text>
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
          <Text style={styles.sectionTitle}>CONDICIONES AMBIENTALES</Text>
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
          <Text style={styles.equipmentTitle}>EQUIPAMIENTO Y TÉCNICA</Text>
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
            <Text style={styles.performanceTitle}>EVALUACIÓN DEL RENDIMIENTO</Text>
            <Text style={[styles.performanceRating, { color: getPerformanceColor(participant.performance_rating) }]}>
              {participant.performance_rating}/5
            </Text>
            <Text style={styles.performanceDesc}>
              {getPerformanceText(participant.performance_rating)}
            </Text>
          </View>
        )}

        {/* Habilidades Completadas */}
        {participant.skills_completed && Object.keys(participant.skills_completed).length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>HABILIDADES EVALUADAS</Text>
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
            <Text style={styles.notesTitle}>OBSERVACIONES DEL INSTRUCTOR</Text>
            <Text style={styles.notesText}>{participant.individual_notes}</Text>
          </View>
        )}

        {/* Multimedia */}
        {studentMediaFiles && studentMediaFiles.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>MULTIMEDIA ADJUNTA</Text>
            <Text style={styles.mediaCount}>
              Archivos Generales: {studentMediaFiles.length} archivo(s) - {studentMediaFiles.filter(f => f.type === 'image').length} imágenes, {studentMediaFiles.filter(f => f.type === 'video').length} videos
            </Text>
            <Text style={styles.mediaInfo}>
              Ver multimedia completa en: https://app.lovable.app/estudiantes
            </Text>
            {studentMediaFiles.map((file, index) => (
              <Text key={index} style={styles.mediaFileUrl}>
                • {file.name} - {file.type === 'image' ? 'Imagen' : 'Video'}
              </Text>
            ))}
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