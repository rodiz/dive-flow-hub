import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Line, Rect } from '@react-pdf/renderer';
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
  chartContainer: {
    height: 120,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  diveItem: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  diveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diveName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  diveDate: {
    fontSize: 9,
    color: '#64748b',
  },
  diveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  diveDetail: {
    fontSize: 8,
    color: '#475569',
    width: '30%',
    marginBottom: 3,
  },
  performanceRating: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#dcfce7',
    padding: 3,
    borderRadius: 3,
    textAlign: 'center',
  },
  recommendationBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skillBadge: {
    backgroundColor: '#dcfce7',
    padding: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 8,
    color: '#166534',
  },
  analysisContainer: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginBottom: 15,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  trendLabel: {
    fontSize: 9,
    color: '#374151',
    width: 100,
    marginRight: 10,
  },
  trendValue: {
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1,
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

  const getAnalysisData = () => {
    const depths = selectedDiveData.map(d => d.dive_participants[0]?.depth_achieved || d.depth_achieved || 0);
    const times = selectedDiveData.map(d => d.dive_participants[0]?.bottom_time || d.bottom_time || 0);
    const performances = selectedDiveData.map(d => d.dive_participants[0]?.performance_rating || 0).filter(p => p > 0);
    
    // Análisis de tendencias más detallado
    const depthProgression = depths.length > 1 ? 
      ((depths[depths.length - 1] - depths[0]) / depths[0] * 100).toFixed(1) : '0';
    const performanceProgression = performances.length > 1 ? 
      ((performances[performances.length - 1] - performances[0]) / performances[0] * 100).toFixed(1) : '0';
    
    return {
      avgDepth: depths.length > 0 ? (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1) : '0',
      avgTime: times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0',
      depthProgression,
      performanceProgression,
      consistencyScore: depths.length > 1 ? Math.max(0, (10 - (Math.max(...depths) - Math.min(...depths)) / Math.max(...depths) * 10)).toFixed(1) : '10',
      safetyCompliance: selectedDiveData.filter(d => d.dive_participants[0]?.safety_stop_time).length / selectedDiveData.length * 100,
      equipmentCompliance: selectedDiveData.filter(d => d.dive_participants[0]?.equipment_check).length / selectedDiveData.length * 100,
    };
  };

  const generateRecommendations = () => {
    const analysis = getAnalysisData();
    const recommendations = [];

    // Recomendaciones basadas en rendimiento
    if (stats.avgPerformance < 6) {
      recommendations.push({
        category: 'Rendimiento',
        text: 'Se recomienda revisar técnicas básicas de buceo y practicar más en aguas poco profundas.',
        priority: 'Alta'
      });
    } else if (stats.avgPerformance < 8) {
      recommendations.push({
        category: 'Rendimiento',
        text: 'Buen progreso. Continuar con práctica regular y considerar cursos avanzados.',
        priority: 'Media'
      });
    } else {
      recommendations.push({
        category: 'Rendimiento',
        text: 'Excelente rendimiento. Listo para desafíos más avanzados y especializaciones.',
        priority: 'Baja'
      });
    }

    // Recomendaciones basadas en profundidad
    if (stats.maxDepth < 15) {
      recommendations.push({
        category: 'Progresión',
        text: 'Considerar aumentar gradualmente la profundidad con supervisión del instructor.',
        priority: 'Media'
      });
    } else if (stats.maxDepth > 25) {
      recommendations.push({
        category: 'Seguridad',
        text: 'Mantener protocolos de seguridad estrictos para buceo profundo. Considerar curso Deep Diver.',
        priority: 'Alta'
      });
    }

    // Recomendaciones de seguridad
    if (parseFloat(analysis.safetyCompliance.toFixed(1)) < 80) {
      recommendations.push({
        category: 'Seguridad',
        text: 'Mejorar cumplimiento de paradas de seguridad. Es fundamental para prevenir enfermedad descompresiva.',
        priority: 'Alta'
      });
    }

    // Recomendaciones de equipamiento
    if (parseFloat(analysis.equipmentCompliance.toFixed(1)) < 90) {
      recommendations.push({
        category: 'Equipamiento',
        text: 'Realizar chequeos de equipo más rigurosos antes de cada inmersión.',
        priority: 'Alta'
      });
    }

    return recommendations;
  };

  const getSkillsAnalysis = () => {
    const skills = {};
    selectedDiveData.forEach(dive => {
      if (dive.dive_participants[0]?.skills_completed) {
        Object.entries(dive.dive_participants[0].skills_completed).forEach(([skill, completed]) => {
          if (!skills[skill]) skills[skill] = { completed: 0, total: 0 };
          skills[skill].total++;
          if (completed) skills[skill].completed++;
        });
      }
    });
    return skills;
  };

  // Simple visual elements using basic shapes
  const ProgressBar = ({ value, max, label, color = '#0ea5e9' }: { value: number, max: number, label: string, color?: string }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 9, marginBottom: 4, color: '#374151' }}>{label}</Text>
      <View style={{ 
        backgroundColor: '#e2e8f0', 
        height: 8, 
        borderRadius: 4,
        flexDirection: 'row'
      }}>
        <View style={{ 
          backgroundColor: color, 
          width: `${(value / max) * 100}%`, 
          height: 8, 
          borderRadius: 4 
        }} />
      </View>
      <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{value}/{max}</Text>
    </View>
  );

  const StatCard = ({ icon, value, label, color }: { icon: string, value: string, label: string, color: string }) => (
    <View style={[styles.statBox, { borderLeft: `4 solid ${color}`, minHeight: 60 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const analysis = getAnalysisData();
  const recommendations = generateRecommendations();
  const skillsAnalysis = getSkillsAnalysis();

  return (
    <Document>
      {/* Página 1: Información General y Estadísticas */}
      <Page size="A4" style={styles.page}>
        {/* Header con diseño mejorado */}
        <View style={styles.header}>
          <Text style={styles.title}>
            REPORTE DE PROGRESO PROFESIONAL
          </Text>
          <Text style={styles.subtitle}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.subtitle}>
            Generado el {currentDate}
          </Text>
        </View>

        {/* Información del Estudiante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACION DEL ESTUDIANTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>
          {student.certification_level && (
            <View style={styles.row}>
              <Text style={styles.label}>Certificacion:</Text>
              <Text style={styles.value}>{student.certification_level}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Periodo:</Text>
            <Text style={styles.value}>
              {selectedDiveData.length > 0 ? 
                `${format(new Date(selectedDiveData[selectedDiveData.length - 1]?.dive_date), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(selectedDiveData[0]?.dive_date), 'dd/MM/yyyy', { locale: es })}` 
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Estadísticas principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTADISTICAS PRINCIPALES</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              icon="" 
              value={stats.totalDives.toString()} 
              label="Total Inmersiones" 
              color="#0ea5e9" 
            />
            <StatCard 
              icon="" 
              value={`${(stats.totalBottomTime / 60).toFixed(1)}h`} 
              label="Experiencia Total" 
              color="#22c55e" 
            />
            <StatCard 
              icon="" 
              value={`${stats.maxDepth}m`} 
              label="Profundidad Maxima" 
              color="#f59e0b" 
            />
            <StatCard 
              icon="" 
              value={`${stats.avgPerformance.toFixed(1)}/5`} 
              label="Rendimiento Promedio" 
              color={getPerformanceColor(stats.avgPerformance)} 
            />
          </View>
        </View>

        {/* Indicadores de progreso visual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INDICADORES DE PROGRESO</Text>
          <ProgressBar 
            value={analysis.safetyCompliance} 
            max={100} 
            label="Cumplimiento de Seguridad (%)" 
            color="#22c55e" 
          />
          <ProgressBar 
            value={analysis.equipmentCompliance} 
            max={100} 
            label="Chequeos de Equipamiento (%)" 
            color="#0ea5e9" 
          />
          <ProgressBar 
            value={stats.avgPerformance} 
            max={5} 
            label="Rendimiento Promedio" 
            color="#f59e0b" 
          />
        </View>

        {/* Análisis Avanzado */}
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>ANALISIS DETALLADO DE PROGRESO</Text>
          <View style={styles.statsGrid}>
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
              <Text style={styles.statLabel}>Índice Consistencia</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analysis.safetyCompliance.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Cumplimiento Seguridad</Text>
            </View>
          </View>

          <View style={styles.trendIndicator}>
            <Text style={styles.trendLabel}>Progresión Profundidad:</Text>
            <Text style={[styles.trendValue, { color: parseFloat(analysis.depthProgression) > 0 ? '#059669' : '#dc2626' }]}>
              {parseFloat(analysis.depthProgression) > 0 ? '+' : ''}{analysis.depthProgression}%
            </Text>
          </View>
          <View style={styles.trendIndicator}>
            <Text style={styles.trendLabel}>Evolución Rendimiento:</Text>
            <Text style={[styles.trendValue, { color: parseFloat(analysis.performanceProgression) > 0 ? '#059669' : '#dc2626' }]}>
              {parseFloat(analysis.performanceProgression) > 0 ? '+' : ''}{analysis.performanceProgression}%
            </Text>
          </View>
          <View style={styles.trendIndicator}>
            <Text style={styles.trendLabel}>Chequeos Equipamiento:</Text>
            <Text style={[styles.trendValue, { color: analysis.equipmentCompliance > 80 ? '#059669' : '#dc2626' }]}>
              {analysis.equipmentCompliance.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Habilidades Desarrolladas */}
        {Object.keys(skillsAnalysis).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HABILIDADES DESARROLLADAS</Text>
            <View style={styles.skillsGrid}>
              {Object.entries(skillsAnalysis).map(([skill, data]: [string, any]) => (
                <View key={skill} style={styles.skillBadge}>
                  <Text style={styles.skillText}>
                    {skill}: {data.completed}/{data.total} ({((data.completed/data.total)*100).toFixed(0)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recomendaciones Profesionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECOMENDACIONES PROFESIONALES</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>
                {rec.category} - Prioridad {rec.priority}
              </Text>
              <Text style={styles.recommendationText}>{rec.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Página 1 de 2 - Reporte generado por Sistema de Gestión de Buceo</Text>
        </View>
      </Page>

      {/* Página 2: Detalle de Inmersiones */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>DETALLE DE INMERSIONES</Text>
          <Text style={styles.subtitle}>Registro completo de actividades</Text>
        </View>

        {/* Inmersiones Detalladas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            REGISTRO DE INMERSIONES ({selectedDiveData.length})
          </Text>
          
          {selectedDiveData.map((dive) => (
            <View key={dive.id} style={styles.diveItem}>
              <View style={styles.diveHeader}>
                <Text style={styles.diveName}>{dive.dive_sites?.name}</Text>
                <Text style={styles.diveDate}>
                  {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                </Text>
              </View>
              
              <View style={styles.diveGrid}>
                <Text style={styles.diveDetail}>
                  Profundidad: {dive.dive_participants[0]?.depth_achieved || dive.depth_achieved}m
                </Text>
                <Text style={styles.diveDetail}>
                  Tiempo: {dive.dive_participants[0]?.bottom_time || dive.bottom_time}min
                </Text>
                <Text style={styles.diveDetail}>
                  Ubicación: {dive.dive_sites?.location}
                </Text>
              </View>

              {dive.dive_participants[0] && (
                <>
                  <View style={styles.diveGrid}>
                    {dive.dive_participants[0].gas_mix && (
                      <Text style={styles.diveDetail}>Gas: {dive.dive_participants[0].gas_mix}</Text>
                    )}
                    {dive.dive_participants[0].visibility_conditions && (
                      <Text style={styles.diveDetail}>Visibilidad: {dive.dive_participants[0].visibility_conditions}m</Text>
                    )}
                    {dive.dive_participants[0].water_temperature && (
                      <Text style={styles.diveDetail}>Temp: {dive.dive_participants[0].water_temperature}°C</Text>
                    )}
                  </View>
                  
                  <View style={styles.diveGrid}>
                    {dive.dive_participants[0].ballast_weight && (
                      <Text style={styles.diveDetail}>Lastre: {dive.dive_participants[0].ballast_weight}kg</Text>
                    )}
                    {dive.dive_participants[0].tank_pressure_start && (
                      <Text style={styles.diveDetail}>P.Inicial: {dive.dive_participants[0].tank_pressure_start}bar</Text>
                    )}
                    {dive.dive_participants[0].tank_pressure_end && (
                      <Text style={styles.diveDetail}>P.Final: {dive.dive_participants[0].tank_pressure_end}bar</Text>
                    )}
                  </View>

                  {dive.dive_participants[0].performance_rating && (
                    <View style={[styles.performanceRating, { backgroundColor: getPerformanceColor(dive.dive_participants[0].performance_rating) + '20' }]}>
                      <Text style={{ color: getPerformanceColor(dive.dive_participants[0].performance_rating), fontSize: 9, fontWeight: 'bold' }}>
                        Rendimiento: {dive.dive_participants[0].performance_rating}/5
                      </Text>
                    </View>
                  )}

                  {dive.dive_participants[0].individual_notes && (
                    <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                      Notas: {dive.dive_participants[0].individual_notes}
                    </Text>
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        {/* Información del Instructor */}
        {selectedDiveData.length > 0 && selectedDiveData[0].instructor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMACION DEL INSTRUCTOR</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Instructor:</Text>
              <Text style={styles.value}>
                {selectedDiveData[0].instructor.first_name} {selectedDiveData[0].instructor.last_name}
              </Text>
            </View>
            {selectedDiveData[0].diving_center && (
              <View style={styles.row}>
                <Text style={styles.label}>Centro de Buceo:</Text>
                <Text style={styles.value}>{selectedDiveData[0].diving_center.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Multimedia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MULTIMEDIA ADJUNTA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Archivos Generales:</Text>
            <Text style={styles.value}>
              {studentMediaFiles.length} archivo(s) - {studentMediaFiles.filter(f => f.type === 'image').length} imágenes, {studentMediaFiles.filter(f => f.type === 'video').length} videos
            </Text>
          </View>
          
          <Text style={{ fontSize: 9, color: '#374151', marginBottom: 6 }}>
            Ver multimedia completa en: https://app.lovable.app/estudiantes
          </Text>
          
          {studentMediaFiles.slice(0, 5).map((file, idx) => (
            <Text key={idx} style={{ fontSize: 8, color: '#64748b', marginLeft: 120, marginBottom: 2 }}>
              • {file.name} - {file.type === 'image' ? 'Imagen' : 'Video'}
            </Text>
          ))}
          
          {studentMediaFiles.length > 5 && (
            <Text style={{ fontSize: 8, color: '#64748b', marginLeft: 120 }}>
              ... y {studentMediaFiles.length - 5} archivo(s) más
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Página 2 de 2 - Este reporte es válido únicamente con la firma digital del instructor certificado</Text>
        </View>
      </Page>
    </Document>
  );
};