import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import LoadingOverlay from '../../components/LoadingOverlay';
export default function CreateProjectScreen() {
  const params = useLocalSearchParams<{
    team_id: string;
    team_name: string;
    team_creator_id: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [projectName, setProjectName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async () => {
    const userID = await getUserId();
    const nameEmpty = !projectName.trim();
    const descEmpty = !deadline.trim();

    if (nameEmpty || descEmpty || !userID) {
      setErrors({ name: nameEmpty, description: descEmpty });
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      const response = await fetch(
        `http://${ipAddr}:5000/createProject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectName,
            deadline: deadline,
            team_id: params.team_id,
          }),
        }
      );
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        router.replace({
          pathname: './team',
          params: {
            team_id: params.team_id,
            team_name: params.team_name,
            team_creator_id: params.team_creator_id,
            user: userID.toString(),
          },
        });
      } else if (response.status === 403) {
        Alert.alert('Error', 'You don’t have permission for that.');
      } else if (response.status === 401) {
        Alert.alert('Error', 'We couldn’t authenticate you.');
      } else {
        Alert.alert('Error', data.message || 'Failed to create project.');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Something went wrong!');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />
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
            if (errors.name && text.trim()) setErrors((p) => ({ ...p, name: false }));
          }}
        />
        {errors.name && <Text style={[styles.errorIcon]}>❌</Text>}
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
            if (errors.description && text.trim())
              setErrors((p) => ({ ...p, description: false }));
          }}
        />
        {errors.description && <Text style={[styles.errorIcon]}>❌</Text>}
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateProject}
        disabled={isLoading}
      >
        <Text style={[styles.createButtonText, { color: theme.text }]}>
          Create Project
        </Text>
      </TouchableOpacity>


      <LoadingOverlay visible={isLoading} />

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    width: '90%',
    padding: 10,
    marginBottom: 10,
  },
  inputError: { borderColor: 'red' },
  errorIcon: { marginLeft: 5, color: 'red', fontSize: 18 },
  createButton: {
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: { fontSize: 16, fontWeight: 'bold' },
  toastCenter: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 5,
  },
  toastText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
