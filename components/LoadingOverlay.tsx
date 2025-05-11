import React from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

type Props = {
  visible: boolean;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
};

export default function LoadingOverlay({
  visible,
  color = '#70ABAF',
  backgroundColor = 'rgba(0,0,0,0.3)',
  style,
}: Props) {
  if (!visible) return null;
  return (
    <View style={[styles.overlay, { backgroundColor }, style]}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
