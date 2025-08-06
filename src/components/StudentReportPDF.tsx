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
                      • {url}
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
                    {index + 1}. {media.name} ({media.type}) - {media.url}
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