import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#00ff00',
  backgroundColor = '#1a1a1a',
  height = 4,
  showPercentage = true,
}) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View style={styles.container}>
      <View style={[styles.background, { backgroundColor, height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{progress.toFixed(1)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  background: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  percentage: {
    fontSize: 12,
    fontFamily: 'Courier New',
    color: '#00ff00',
    minWidth: 45,
    textAlign: 'right',
  },
});

export default ProgressBar;