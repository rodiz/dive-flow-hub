import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
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
    equipment_check_completed?: boolean;
    medical_check_completed?: boolean;
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

interface StudentReportPDFProps {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    certification_level?: string;
  };
  dives: DiveData[];
  selectedDives: string[];
  studentMediaFiles: { url: string; name: string; type: 'image' | 'video' }[];
  stats: {
    totalDives: number;
    totalBottomTime: number;
    maxDepth: number;
    avgPerformance: number;
  };
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    width: 120,
  },
  value: {
    fontSize: 12,
    color: '#1e293b',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 5,
    width: '23%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  diveItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 8,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  diveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  diveName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  diveDate: {
    fontSize: 10,
    color: '#64748b',
  },
  diveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  diveStatItem: {
    fontSize: 10,
    color: '#475569',
  },
  performanceRating: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  diveNotes: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#64748b',
  },
});

export const StudentReportPDF: React.FC<StudentReportPDFProps> = ({
  student,
  dives,
  selectedDives,
  studentMediaFiles,
  stats
}) => {
  const selectedDiveData = dives.filter(d => selectedDives.includes(d.id));
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: es });

  const getPerformanceColor = (rating: number) => {
    if (rating >= 8) return '#059669';
    if (rating >= 6) return '#d97706';
    return '#dc2626';
  };

  const shortenUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, 15);
    const end = url.substring(url.length - 20);
    return `${start}...${end}`;
  };

  const getAnalysisData = () => {
    const depths = selectedDiveData.map(d => d.dive_participants[0]?.depth_achieved || d.depth_achieved || 0);
    const times = selectedDiveData.map(d => d.dive_participants[0]?.bottom_time || d.bottom_time || 0);
    const performances = selectedDiveData.map(d => d.dive_participants[0]?.performance_rating || 0).filter(p => p > 0);
    
    return {
      avgDepth: depths.length > 0 ? (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1) : '0',
      depthTrend: depths.length > 1 ? (depths[depths.length - 1] > depths[0] ? 'Aumentando' : 'Estable') : 'N/A',
      avgTime: times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0',
      performanceTrend: performances.length > 1 ? (performances[performances.length - 1] > performances[0] ? 'Mejorando' : 'Estable') : 'N/A',
      totalExperience: times.reduce((a, b) => a + b, 0),
      consistencyScore: depths.length > 1 ? (10 - (Math.max(...depths) - Math.min(...depths)) / Math.max(...depths) * 10).toFixed(1) : '10'
    };
  };

  const analysis = getAnalysisData();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Reporte de Progreso - {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.subtitle}>
            Generado el {currentDate}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Estudiante</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre Completo:</Text>
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
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalDives}</Text>
              <Text style={styles.statLabel}>Total Inmersiones</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalBottomTime}min</Text>
              <Text style={styles.statLabel}>Tiempo Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.maxDepth}m</Text>
              <Text style={styles.statLabel}>Profundidad Máx</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: getPerformanceColor(stats.avgPerformance) }]}>
                {stats.avgPerformance.toFixed(1)}/10
              </Text>
              <Text style={styles.statLabel}>Rendimiento Prom</Text>
            </View>
          </View>
        </View>

        {/* Analysis and Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis y Tendencias</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.avgDepth}m</Text>
              <Text style={styles.statLabel}>Profundidad Promedio</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.avgTime}min</Text>
              <Text style={styles.statLabel}>Tiempo Promedio</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.consistencyScore}</Text>
              <Text style={styles.statLabel}>Consistencia</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.totalExperience}h</Text>
              <Text style={styles.statLabel}>Experiencia Total</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tendencia de Profundidad:</Text>
            <Text style={styles.value}>{analysis.depthTrend}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tendencia de Rendimiento:</Text>
            <Text style={styles.value}>{analysis.performanceTrend}</Text>
          </View>
        </View>

        {/* Selected Dives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Inmersiones Incluidas ({selectedDiveData.length})
          </Text>
          {selectedDiveData.map((dive, index) => (
            <View key={dive.id} style={styles.diveItem}>
              <View style={styles.diveHeader}>
                <Text style={styles.diveName}>{dive.dive_sites?.name}</Text>
                <Text style={styles.diveDate}>
                  {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                </Text>
              </View>
              
              <View style={styles.diveStats}>
                <Text style={styles.diveStatItem}>
                  Profundidad: {dive.dive_participants[0]?.depth_achieved || dive.depth_achieved}m
                </Text>
                <Text style={styles.diveStatItem}>
                  Tiempo: {dive.dive_participants[0]?.bottom_time || dive.bottom_time}min
                </Text>
                {dive.dive_participants[0]?.performance_rating && (
                  <Text style={[styles.performanceRating, { 
                    color: getPerformanceColor(dive.dive_participants[0].performance_rating) 
                  }]}>
                    Rendimiento: {dive.dive_participants[0].performance_rating}/10
                  </Text>
                )}
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Ubicación:</Text>
                <Text style={styles.value}>{dive.dive_sites?.location}</Text>
              </View>

              {/* Detailed Participant Information */}
              {dive.dive_participants[0] && (
                <View style={{ marginTop: 5 }}>
                  <Text style={[styles.label, { marginBottom: 3 }]}>Detalles Técnicos:</Text>
                  <View style={styles.diveStats}>
                    {dive.dive_participants[0].wetsuit_thickness && (
                      <Text style={styles.diveStatItem}>Grosor Traje: {dive.dive_participants[0].wetsuit_thickness}mm</Text>
                    )}
                    {dive.dive_participants[0].gas_mix && (
                      <Text style={styles.diveStatItem}>Mezcla Gas: {dive.dive_participants[0].gas_mix}</Text>
                    )}
                    {dive.dive_participants[0].visibility_conditions && (
                      <Text style={styles.diveStatItem}>Visibilidad: {dive.dive_participants[0].visibility_conditions}m</Text>
                    )}
                  </View>
                  <View style={styles.diveStats}>
                    {dive.dive_participants[0].water_temperature !== undefined && (
                      <Text style={styles.diveStatItem}>Temp Agua: {dive.dive_participants[0].water_temperature}°C</Text>
                    )}
                    {dive.dive_participants[0].tank_pressure_start && (
                      <Text style={styles.diveStatItem}>Presión Inicial: {dive.dive_participants[0].tank_pressure_start}bar</Text>
                    )}
                    {dive.dive_participants[0].tank_pressure_end && (
                      <Text style={styles.diveStatItem}>Presión Final: {dive.dive_participants[0].tank_pressure_end}bar</Text>
                    )}
                  </View>
                  <View style={styles.diveStats}>
                    {dive.dive_participants[0].ballast_weight && (
                      <Text style={styles.diveStatItem}>Lastre: {dive.dive_participants[0].ballast_weight}kg</Text>
                    )}
                    {dive.dive_participants[0].safety_stop_time && (
                      <Text style={styles.diveStatItem}>Parada Seguridad: {dive.dive_participants[0].safety_stop_time}min</Text>
                    )}
                    {dive.dive_participants[0].oxygen_amount && (
                      <Text style={styles.diveStatItem}>Oxígeno: {dive.dive_participants[0].oxygen_amount}%</Text>
                    )}
                  </View>
                  {dive.dive_participants[0].current_strength && (
                    <View style={styles.diveStats}>
                      <Text style={styles.diveStatItem}>Fuerza Corriente: {dive.dive_participants[0].current_strength}/10</Text>
                    </View>
                  )}
                  
                  {/* Equipment and Medical Checks */}
                  <View style={styles.diveStats}>
                    {dive.dive_participants[0].equipment_check_completed !== undefined && (
                      <Text style={styles.diveStatItem}>
                        Chequeo Equipo: {dive.dive_participants[0].equipment_check_completed ? 'Completado' : 'No completado'}
                      </Text>
                    )}
                    {dive.dive_participants[0].medical_check_completed !== undefined && (
                      <Text style={styles.diveStatItem}>
                        Chequeo Médico: {dive.dive_participants[0].medical_check_completed ? 'Completado' : 'No completado'}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {dive.dive_participants[0]?.individual_notes && (
                <Text style={styles.diveNotes}>
                  Notas: {dive.dive_participants[0].individual_notes}
                </Text>
              )}

              {/* Multimedia URLs for this dive */}
              {((dive.photos?.length || 0) + (dive.videos?.length || 0) + (dive.dive_participants[0]?.images?.length || 0) + (dive.dive_participants[0]?.videos?.length || 0)) > 0 && (
                <View style={{ marginTop: 5 }}>
                  <Text style={[styles.diveNotes, { fontStyle: 'normal', fontWeight: 'bold' }]}>
                    Multimedia de esta inmersión:
                  </Text>
                  {[...(dive.photos || []), ...(dive.videos || []), ...(dive.dive_participants[0]?.images || []), ...(dive.dive_participants[0]?.videos || [])].slice(0, 3).map((url, idx) => (
                    <Text key={idx} style={[styles.diveNotes, { fontSize: 8 }]}>
                      • {shortenUrl(url)}
                    </Text>
                  ))}
                  {((dive.photos?.length || 0) + (dive.videos?.length || 0) + (dive.dive_participants[0]?.images?.length || 0) + (dive.dive_participants[0]?.videos?.length || 0)) > 3 && (
                    <Text style={[styles.diveNotes, { fontSize: 8 }]}>
                      ... y {((dive.photos?.length || 0) + (dive.videos?.length || 0) + (dive.dive_participants[0]?.images?.length || 0) + (dive.dive_participants[0]?.videos?.length || 0)) - 3} archivos más
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Instructor and Center Information */}
        {selectedDiveData.length > 0 && (selectedDiveData[0].instructor || selectedDiveData[0].diving_center) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Instructor y Centro</Text>
            {selectedDiveData[0].instructor && (
              <View style={styles.row}>
                <Text style={styles.label}>Instructor:</Text>
                <Text style={styles.value}>
                  {selectedDiveData[0].instructor.first_name} {selectedDiveData[0].instructor.last_name}
                </Text>
              </View>
            )}
            {selectedDiveData[0].diving_center && (
              <View style={styles.row}>
                <Text style={styles.label}>Centro de Buceo:</Text>
                <Text style={styles.value}>{selectedDiveData[0].diving_center.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Multimedia Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multimedia</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Archivos generales del estudiante:</Text>
            <Text style={styles.value}>
              {studentMediaFiles.length} archivo(s) - {studentMediaFiles.filter(f => f.type === 'image').length} imágenes, {studentMediaFiles.filter(f => f.type === 'video').length} videos
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Multimedia de inmersiones:</Text>
            <Text style={styles.value}>
              {selectedDiveData.reduce((total, dive) => 
                total + (dive.photos?.length || 0) + (dive.videos?.length || 0) +
                (dive.dive_participants[0]?.images?.length || 0) + 
                (dive.dive_participants[0]?.videos?.length || 0), 0
              )} archivo(s)
            </Text>
          </View>
          
          {/* Multimedia URLs */}
          {studentMediaFiles.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { marginBottom: 5 }]}>Enlaces de Multimedia del Estudiante:</Text>
              {studentMediaFiles.slice(0, 10).map((media, index) => (
                <View key={index} style={styles.row}>
                  <Text style={[styles.value, { fontSize: 9 }]}>
                    {index + 1}. {media.name} ({media.type}) - {shortenUrl(media.url, 60)}
                  </Text>
                </View>
              ))}
              {studentMediaFiles.length > 10 && (
                <Text style={[styles.value, { fontSize: 9, fontStyle: 'italic' }]}>
                  ... y {studentMediaFiles.length - 10} archivos más
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Este reporte fue generado automáticamente por el sistema de gestión de buceo.
          Para más información, contacte al instructor responsable.
        </Text>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
          `Página ${pageNumber} de ${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
};