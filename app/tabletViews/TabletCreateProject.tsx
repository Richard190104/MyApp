import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';

interface TabletCreateProjectScreenProps {
  projectName: string;
  setProjectName: (name: string) => void;
  deadline: string;
  setDeadline: (date: string) => void;
  errors: { name?: boolean; description?: boolean };
  handleCreateProject: () => void;
  isLoading: boolean;
}

const TabletCreateProjectScreen: React.FC<TabletCreateProjectScreenProps> = ({
  projectName,
  setProjectName,
  deadline,
  setDeadline,
  errors,
  handleCreateProject,
  isLoading,
}) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <TopBar/>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.leftPanel}>
        <Text style={[styles.title, { color: theme.text }]}>Create new Project</Text>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Project name"
            placeholderTextColor={theme.text}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary },
              errors.name && styles.inputError,
            ]}
            value={projectName}
            onChangeText={(text) => {
              setProjectName(text);
            }}
          />
          {errors.name && <Text style={styles.errorIcon}>❌</Text>}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Deadline (YYYY-MM-DD)"
            placeholderTextColor={theme.text}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary },
              errors.description && styles.inputError,
            ]}
            value={deadline}
            onChangeText={(text) => {
              setDeadline(text);
            }}
          />
          {errors.description && <Text style={styles.errorIcon}>❌</Text>}
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateProject}
          disabled={isLoading}
        >
          <Text style={[styles.createButtonText, { color: theme.text }]}>Create Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightPanel}>
        <Ionicons name="clipboard-outline" size={120} color={theme.primary} />
        <Text style={[styles.rightText, { color: theme.text }]}>Fill out the form to start your project</Text>
      </View>
    </View>
    <BottomBar/>
    </SafeAreaView>
  );
};

export default TabletCreateProjectScreen;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    padding: 20,
  },
  leftPanel: {
    width: '50%',
    paddingRight: 20,
    justifyContent: 'center',
  },
  rightPanel: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorIcon: {
    marginLeft: 8,
    fontSize: 18,
    color: 'red',
  },
  createButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    width: '80%',
  },
});