import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SDKStatus } from '../types';

interface StatusIndicatorProps {
  status: SDKStatus;
  modelReady?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  modelReady = false 
}) => {
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!status.initialized || !modelReady) {
      // Create pulsing animation for loading state
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [status.initialized, modelReady, pulse]);

  const getStatusText = (): string => {
    if (status.error) {
      return 'SDK: Error';
    }
    if (!status.initialized) {
      return 'SDK: Initializing';
    }
    if (!modelReady) {
      return 'SDK: Loading Model';
    }
    return 'SDK: Ready';
  };

  const getStatusColor = (): string => {
    if (status.error) {
      return '#ff0040';
    }
    if (!status.initialized || !modelReady) {
      return '#ffaa00';
    }
    return '#00ff00';
  };

  const getStatusIcon = (): string => {
    if (status.error) {
      return '⚠';
    }
    if (!status.initialized || !modelReady) {
      return '⟳';
    }
    return '●';
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { opacity: pulse }]}>
        <Text style={[styles.icon, { color: getStatusColor() }]}>
          {getStatusIcon()}
        </Text>
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {status.currentModel && (
          <Text style={styles.modelText}>
            Model: {status.currentModel}
          </Text>
        )}
        {status.error && (
          <Text style={styles.errorText}>
            {status.error}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  modelText: {
    fontSize: 11,
    fontFamily: 'Courier New',
    color: '#999999',
    marginTop: 2,
  },
  errorText: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: '#ff0040',
    marginTop: 2,
  },
});

export default StatusIndicator;