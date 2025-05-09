import React, { useState } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { defaultDarkTheme, defaultLightTheme, useTheme } from '@/components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import ColorPicker, { Panel1, Swatches } from 'reanimated-color-picker';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';

export default function ThemesManagementTablet() {
  const { theme, toggleTheme, setCustomTheme } = useTheme();
  const [customTheme, setLocalCustomTheme] = useState(theme);
  const [selectedColor, setSelectedColor] = useState<string>(theme.primary);

  const applyCustomColor = (field: keyof typeof customTheme) => {
    if (!selectedColor.startsWith('#') || selectedColor.length !== 7) {
      console.error('Invalid color:', selectedColor);
      return;
    }

    const updatedTheme = {
      ...customTheme,
      [field]: selectedColor,
      mode: customTheme.mode,
    };

    setLocalCustomTheme(updatedTheme);
    setCustomTheme(updatedTheme);
  };

  const onSelectColor = ({ hex }: { hex: string }) => {
    setSelectedColor(hex);
  };
  function toggle() {
    toggleTheme();
    if(theme.mode == 'light'){
      setLocalCustomTheme(defaultDarkTheme);

    }
    else{
      setLocalCustomTheme(defaultLightTheme);

    }

  }
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: theme.card }]}
          onPress={toggle}
        >
          <Text style={[styles.toggleText, { color: theme.text }]}>Toggle Light / Dark</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Customize Theme Colors</Text>

        <View style={styles.rowLayout}>
          <View style={styles.leftPanel}>
            <ColorPicker style={{ width: '100%' }} value={theme.primary} onCompleteJS={onSelectColor}>
              <Panel1 style={{ margin: 20 }} />
              <Swatches />
            </ColorPicker>
          </View>

          <View style={styles.rightPanel}>
            {([
              { label: 'Set Background', key: 'background' },
              { label: 'Set Text Color', key: 'text' },
              { label: 'Set Card Color', key: 'card' },
              { label: 'Set Button Color', key: 'primary' },
              { label: 'Set Bottom Bar Color', key: 'bottombar' },
            ] as { label: string; key: keyof typeof customTheme }[]).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.button, { backgroundColor: theme.card }]}
                onPress={() => applyCustomColor(item.key)}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>{item.label}</Text>
                <MaterialIcons name="square" size={24} color={customTheme[item.key]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  toggleButton: {
    alignSelf: 'center',
    marginBottom: 30,
    padding: 15,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  leftPanel: {
    flex: 1,
    alignItems: 'center',
  },
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
