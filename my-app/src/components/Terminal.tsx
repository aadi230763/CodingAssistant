import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { AgentThought } from '../types';

interface TerminalProps {
  thoughts: AgentThought[];
  title?: string;
}

const Terminal: React.FC<TerminalProps> = ({ thoughts, title = 'Agent Thoughts' }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    // Auto-scroll to bottom when new thoughts are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [thoughts]);

  const getThoughtColor = (type: AgentThought['type']): string => {
    switch (type) {
      case 'success': return '#00ff00';
      case 'error': return '#ff0040';
      case 'warning': return '#ffaa00';
      case 'processing': return '#00aaff';
      default: return '#ffffff';
    }
  };

  const getThoughtPrefix = (type: AgentThought['type']): string => {
    switch (type) {
      case 'success': return '[✓]';
      case 'error': return '[✗]';
      case 'warning': return '[⚠]';
      case 'processing': return '[⟳]';
      default: return '[•]';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.controls}>
          <View style={[styles.dot, { backgroundColor: '#ff0040' }]} />
          <View style={[styles.dot, { backgroundColor: '#ffaa00' }]} />
          <View style={[styles.dot, { backgroundColor: '#00ff00' }]} />
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {thoughts.length === 0 ? (
          <Text style={styles.emptyState}>$ Waiting for agent activity...</Text>
        ) : (
          thoughts.map((thought) => (
            <View key={thought.id} style={styles.thoughtLine}>
              <Text style={styles.timestamp}>
                {formatTimestamp(thought.timestamp)}
              </Text>
              <Text
                style={[
                  styles.prefix,
                  { color: getThoughtColor(thought.type) }
                ]}
              >
                {getThoughtPrefix(thought.type)}
              </Text>
              <Text
                style={[
                  styles.message,
                  { color: getThoughtColor(thought.type) }
                ]}
              >
                {thought.message}
              </Text>
            </View>
          ))
        )}
        <View style={styles.cursor}>
          <Text style={styles.cursorText}>█</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    maxHeight: 200,
    minHeight: 120,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 16,
  },
  thoughtLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  timestamp: {
    color: '#666666',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginRight: 8,
    minWidth: 70,
  },
  prefix: {
    fontSize: 11,
    fontFamily: 'Courier New',
    marginRight: 4,
    minWidth: 20,
  },
  message: {
    fontSize: 11,
    fontFamily: 'Courier New',
    flex: 1,
    lineHeight: 14,
  },
  emptyState: {
    color: '#666666',
    fontSize: 11,
    fontFamily: 'Courier New',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  cursor: {
    marginTop: 4,
  },
  cursorText: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'Courier New',
  },
});

export default Terminal;