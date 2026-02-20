/**
 * LiveTranscript – Floating speech-to-text bubble
 *
 * Appears above the terminal when the voice pipeline is active.
 * Shows partial (interim) and final transcript text in real time.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { TranscriptResult, VoiceListeningState } from '../types';

interface LiveTranscriptProps {
  transcript: TranscriptResult | null;
  voiceState: VoiceListeningState;
  lastCommand?: string;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  voiceState,
  lastCommand,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  const isVisible = voiceState !== 'idle' || (transcript && transcript.isFinal);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 20, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  // Blinking cursor when listening
  useEffect(() => {
    if (voiceState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      cursorAnim.stopAnimation();
      cursorAnim.setValue(1);
    }
  }, [voiceState]);

  const getStatusIcon = (): string => {
    switch (voiceState) {
      case 'listening': return '🎤';
      case 'processing': return '⚡';
      case 'speaking': return '🔊';
      case 'error': return '⚠️';
      default: return '🎤';
    }
  };

  const getStatusColor = (): string => {
    switch (voiceState) {
      case 'listening': return '#00ff00';
      case 'processing': return '#ffaa00';
      case 'speaking': return '#00ccff';
      case 'error': return '#ff0040';
      default: return '#666';
    }
  };

  const getBorderColor = (): string => {
    switch (voiceState) {
      case 'listening': return '#003300';
      case 'processing': return '#332200';
      case 'speaking': return '#002233';
      case 'error': return '#330011';
      default: return '#222';
    }
  };

  if (!isVisible && !lastCommand) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderColor: getBorderColor(),
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
          {voiceState === 'listening' ? 'LISTENING' :
           voiceState === 'processing' ? 'PROCESSING' :
           voiceState === 'speaking' ? 'SPEAKING' :
           voiceState === 'error' ? 'ERROR' : 'VOICE'}
        </Text>
        {transcript && (
          <Text style={styles.confidence}>
            {(transcript.confidence * 100).toFixed(0)}%
          </Text>
        )}
      </View>

      {/* Transcript text */}
      <View style={styles.transcriptRow}>
        <Text style={[
          styles.transcriptText,
          !transcript?.isFinal && styles.interimText,
        ]}>
          {transcript?.text || (voiceState === 'listening' ? 'Say a command...' : '')}
          {voiceState === 'listening' && (
            <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>▌</Animated.Text>
          )}
        </Text>
      </View>

      {/* Last command badge */}
      {lastCommand && (
        <View style={styles.commandBadge}>
          <Text style={styles.commandLabel}>LAST COMMAND</Text>
          <Text style={styles.commandText}>{lastCommand}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: '700',
    letterSpacing: 1.5,
    flex: 1,
  },
  confidence: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: '#666',
  },
  transcriptRow: {
    minHeight: 24,
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 14,
    fontFamily: 'Courier New',
    color: '#ffffff',
    lineHeight: 20,
  },
  interimText: {
    color: '#999999',
    fontStyle: 'italic',
  },
  cursor: {
    color: '#00ff00',
    fontSize: 14,
  },
  commandBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  commandLabel: {
    fontSize: 8,
    fontFamily: 'Courier New',
    color: '#555',
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 8,
  },
  commandText: {
    fontSize: 11,
    fontFamily: 'Courier New',
    color: '#00ff00',
    flex: 1,
  },
});

export default LiveTranscript;
