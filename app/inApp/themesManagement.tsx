import React, { useState } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, TouchableOpacity, View, Dimensions } from 'react-native';
import { useTheme, defaultLightTheme, defaultDarkTheme } from '@/components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import ColorPicker, { Panel1, Swatches } from 'reanimated-color-picker';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import ThemesManagementTablet from '../tabletViews/TabletThemesManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ThemesManagement() {
  const isTablet = Dimensions.get('window').width >= 768;
  const { theme, toggleTheme, setCustomTheme } = useTheme();
  const [customTheme, setLocalCustomTheme] = useState(theme);
  const [selectedColor, setSelectedColor] = useState<string>(theme.primary);

  const protanopiaPreset = {
    background: '#ffffff',
    text: '#000000',
    card: '#f2f2f2',
    primary: '#228B22',
    bottombar: '#A9A9A9',
    buttonBackground: '#228B22',
    danger: '#FFA500',
  } as const;

  const deuteranopiaPreset = {
    background: '#ffffff',
    text: '#000000',
    card: '#f2f2f2',
    primary: '#0047AB',
    bottombar: '#696969',
    buttonBackground: '#0047AB',
    danger: '#FFD700',
  } as const;

  const applyPresetTheme = (preset: typeof protanopiaPreset) => {
    const updatedTheme = { ...customTheme, ...preset };
    setLocalCustomTheme(updatedTheme);
    setCustomTheme(updatedTheme);
  };

  const applyCustomColor = (field: keyof typeof customTheme) => {
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

  const toggle = () => {
    toggleTheme();
    if (theme.mode === 'light') {
      setLocalCustomTheme(defaultDarkTheme);
    } else {
      setLocalCustomTheme(defaultLightTheme);
    }
  };

  if (isTablet) {
    return <ThemesManagementTablet />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.card }]} onPress={toggle}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Toggle Light/Dark</Text>
        </TouchableOpacity>

        {/* preset buttons */}
        <View style={styles.cbContainer}>
          <TouchableOpacity
            style={[styles.cbButton, { backgroundColor: protanopiaPreset.primary }]}
            onPress={() => applyPresetTheme(protanopiaPreset)}
          >
            <Text style={styles.cbButtonText}>Protanopia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cbButton, { backgroundColor: deuteranopiaPreset.primary }]}
            onPress={() => applyPresetTheme(deuteranopiaPreset)}
          >
            <Text style={styles.cbButtonText}>Deuteranopia</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Customize Theme Colors</Text>

        <View style={styles.pickerContainer}>
          <ColorPicker style={{ width: '70%' }} value={selectedColor} onCompleteJS={onSelectColor}>
            <Panel1 style={{ margin: 20 }} />
            <Swatches />
          </ColorPicker>
        </View>

        <View style={styles.buttonsContainer}>
          {(['background', 'text', 'card', 'primary', 'bottombar'] as (keyof typeof customTheme)[]).map((field) => (
            <TouchableOpacity
              key={field}
              style={[styles.button, { backgroundColor: theme.card }]}
              onPress={() => applyCustomColor(field)}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Set {field.charAt(0).toUpperCase() + field.slice(1)}
              </Text>
              <MaterialIcons name="square" size={24} color={(customTheme as any)[field]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', padding: 20 },
  mainButton: { marginBottom: 20, padding: 15, borderRadius: 10, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  pickerContainer: { alignItems: 'center', marginBottom: 30 },
  buttonsContainer: { width: '100%', marginTop: 20 },
  button: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: { fontWeight: 'bold' },
  cbContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 30 },
  cbButton: { flex: 1, marginHorizontal: 10, padding: 12, borderRadius: 8, alignItems: 'center' },
  cbButtonText: { color: '#fff', fontWeight: 'bold' },
});
