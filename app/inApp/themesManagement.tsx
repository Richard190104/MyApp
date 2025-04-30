import React, { useState } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
export default function ThemesManagement() {
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
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />

      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 100}]}>
      <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.card }]} onPress={toggleTheme}>
          <Text style={[styles.buttonText, {color: theme.text}]}>Toggle Light/Dark</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Customize Theme Colors</Text>

        <View style={styles.pickerContainer}>
        <ColorPicker style={{ width: '70%' }} value='red' onCompleteJS={onSelectColor}>
          <Panel1 style={{ margin: 20 }}/>
          <Swatches />
        </ColorPicker>

        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => applyCustomColor('background')}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Set Background</Text>
            <MaterialIcons name="square" size={24} color={customTheme.background} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => applyCustomColor('text')}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Set Text Color</Text>
            <MaterialIcons name="square" size={24} color={customTheme.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => applyCustomColor('card')}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Set Card Color</Text>
            <MaterialIcons name="square" size={24} color={customTheme.card} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => applyCustomColor('primary')}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Set Button Color</Text>
            <MaterialIcons name="square" size={24} color={customTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => applyCustomColor('bottombar')}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Set Bottom Bar Color</Text>
            <MaterialIcons name="square" size={24} color={customTheme.primary} />
          </TouchableOpacity>

        </View>

        
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  pickerContainer: { alignItems: 'center', marginBottom: 30 },
  selectedColorText: { marginTop: 10, fontSize: 16 },
  buttonsContainer: { width: '100%', marginTop: 20 },
  button: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mainButton: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
function runOnJS(setSelectedColor: React.Dispatch<React.SetStateAction<string>>) {
    throw new Error('Function not implemented.');
}

