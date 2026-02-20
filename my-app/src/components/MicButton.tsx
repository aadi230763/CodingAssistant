/**
 * MicButton – Pulsing microphone button for voice commands
 *
 * States:
 *   idle       → dim green outline, static
 *   listening  → bright green fill, pulsing glow
 *   processing → amber fill, spinning indicator
 *   speaking   → cyan fill, gentle pulse
 *   error      → red fill, static
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { VoiceListeningState } from '../types';

interface MicButtonProps {
  state: VoiceListeningState;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

const STATE_CONFIG: Record<
  VoiceListeningState,
  { icon: string; color: string; glowColor: string; label: string }
> = {
  idle: {
    icon: '🎤',
    color: '#1a3a1a',
    glowColor: '#00ff00',
    label: 'Tap to speak',
  },
  listening: {
    icon: '🎤',
    color: '#00ff00',
    glowColor: '#00ff00',
    label: 'Listening...',
  },
  processing: {
    icon: '⏳',
    color: '#ffaa00',
    glowColor: '#ffaa00',
    label: 'Processing...',
  },
  speaking: {
    icon: '🔊',
    color: '#00ccff',
    glowColor: '#00ccff',
    label: 'Speaking...',
  },
  error: {
    icon: '⚠️',
    color: '#ff0040',
    glowColor: '#ff0040',
    label: 'Error – tap to retry',
  },
};

const MicButton: React.FC<MicButtonProps> = ({
  state,
  onPress,
  disabled = false,
  size = 72,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const config = STATE_CONFIG[state];

  useEffect(() => {
    // Stop any running animations
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();

    if (state === 'listening') {
      // Energetic pulsing
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (state === 'speaking') {
      // Gentle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      glowAnim.setValue(0.5);
    } else if (state === 'processing') {
      // Rapid small pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      glowAnim.setValue(0.6);
    } else {
      // Idle / error: static
      pulseAnim.setValue(1);
      glowAnim.setValue(state === 'error' ? 0.4 : 0.15);
    }
  }, [state]);

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            borderColor: config.glowColor,
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: disabled ? '#222' : config.color,
              borderColor: config.glowColor,
            },
          ]}
        >
          <Text style={[styles.icon, { fontSize: size * 0.38 }]}>{config.icon}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Label */}
      <Text style={[styles.label, { color: config.glowColor }]}>{config.label}</Text>

      {/* VAD indicator dot */}
      {state === 'listening' && (
        <Animated.View
          style={[
            styles.vadDot,
            { opacity: glowAnim },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'Courier New',
    fontWeight: '600',
  },
  vadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
    marginTop: 6,
  },
});

export default MicButton;
