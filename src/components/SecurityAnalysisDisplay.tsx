import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CodeAnalysisResult, SecurityVulnerability } from '../types';

interface SecurityAnalysisDisplayProps {
  analysis: CodeAnalysisResult | null;
  onClose: () => void;
}

const SecurityAnalysisDisplay: React.FC<SecurityAnalysisDisplayProps> = ({ 
  analysis, 
  onClose 
}) => {
  if (!analysis) return null;

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return '#ff0040';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#00aaff';
      default: return '#ffffff';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      case 'LOW': return 'ℹ️';
      default: return '•';
    }
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'CRITICAL': return '#ff0040';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#00ff00';
      default: return '#ffffff';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Security Analysis Report</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Files</Text>
              <Text style={styles.summaryValue}>{analysis.summary.totalFiles}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lines of Code</Text>
              <Text style={styles.summaryValue}>{analysis.summary.linesOfCode.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Security Score</Text>
              <Text style={[styles.summaryValue, { color: getRiskColor(analysis.summary.riskLevel) }]}>
                {analysis.summary.securityScore}/100
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Risk Level</Text>
              <Text style={[styles.summaryValue, { color: getRiskColor(analysis.summary.riskLevel) }]}>
                {analysis.summary.riskLevel}
              </Text>
            </View>
          </View>
        </View>

        {/* Vulnerabilities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🛡️ Vulnerabilities ({analysis.vulnerabilities.length})
          </Text>
          {analysis.vulnerabilities.map((vuln: SecurityVulnerability, index: number) => (
            <View key={vuln.id} style={styles.vulnerabilityCard}>
              <View style={styles.vulnerabilityHeader}>
                <Text style={styles.vulnerabilityIcon}>
                  {getSeverityIcon(vuln.severity)}
                </Text>
                <Text style={styles.vulnerabilityTitle}>{vuln.title}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(vuln.severity) }]}>
                  <Text style={styles.severityText}>{vuln.severity}</Text>
                </View>
              </View>
              
              <Text style={styles.vulnerabilityDescription}>
                {vuln.description}
              </Text>
              
              <View style={styles.vulnerabilityMeta}>
                <Text style={styles.metaLabel}>📁 File:</Text>
                <Text style={styles.metaValue}>{vuln.file}</Text>
                {vuln.line && (
                  <>
                    <Text style={styles.metaLabel}>📍 Line:</Text>
                    <Text style={styles.metaValue}>{vuln.line}</Text>
                  </>
                )}
              </View>

              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationTitle}>💡 Recommendation:</Text>
                <Text style={styles.recommendationText}>{vuln.recommendation}</Text>
              </View>

              {vuln.cwe && (
                <Text style={styles.cweTag}>CWE: {vuln.cwe}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Dependencies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📦 Dependencies ({analysis.dependencies.length})
          </Text>
          {analysis.dependencies.map((dep, index) => (
            <View key={`${dep.name}_${index}`} style={styles.dependencyCard}>
              <View style={styles.dependencyHeader}>
                <Text style={styles.dependencyName}>{dep.name}</Text>
                <Text style={styles.dependencyVersion}>{dep.version}</Text>
              </View>
              <View style={styles.dependencyMeta}>
                {dep.vulnerabilities > 0 && (
                  <Text style={[styles.dependencyStatus, { color: '#ff6600' }]}>
                    ⚠️ {dep.vulnerabilities} vulnerabilities
                  </Text>
                )}
                {dep.outdated && (
                  <Text style={[styles.dependencyStatus, { color: '#ffaa00' }]}>
                    📅 Outdated
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Recommendations</Text>
          {analysis.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationItemText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#00ff00',
    fontSize: 18,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Courier New',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff00',
    paddingLeft: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryLabel: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginBottom: 4,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  vulnerabilityCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6600',
  },
  vulnerabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vulnerabilityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  vulnerabilityTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  vulnerabilityDescription: {
    color: '#cccccc',
    fontSize: 12,
    fontFamily: 'Courier New',
    lineHeight: 16,
    marginBottom: 8,
  },
  vulnerabilityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaLabel: {
    color: '#999999',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginRight: 4,
  },
  metaValue: {
    color: '#00aaff',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginRight: 12,
  },
  recommendationBox: {
    backgroundColor: '#0a0a0a',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#00ff00',
    marginBottom: 8,
  },
  recommendationTitle: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationText: {
    color: '#cccccc',
    fontSize: 10,
    fontFamily: 'Courier New',
    lineHeight: 14,
  },
  cweTag: {
    color: '#666666',
    fontSize: 9,
    fontFamily: 'Courier New',
    alignSelf: 'flex-end',
  },
  dependencyCard: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dependencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dependencyName: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  dependencyVersion: {
    color: '#00aaff',
    fontSize: 10,
    fontFamily: 'Courier New',
  },
  dependencyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dependencyStatus: {
    fontSize: 9,
    fontFamily: 'Courier New',
    marginRight: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationBullet: {
    color: '#00ff00',
    fontSize: 14,
    fontFamily: 'Courier New',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationItemText: {
    color: '#cccccc',
    fontSize: 12,
    fontFamily: 'Courier New',
    flex: 1,
    lineHeight: 16,
  },
});

export default SecurityAnalysisDisplay;