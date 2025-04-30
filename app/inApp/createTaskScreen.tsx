import React, { useEffect, useState } from 'react';
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
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTeamMembers, getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeContext';
import LoadingOverlay from '../../components/LoadingOverlay';

type TeamMember = {
  user_id: number;
  username: string;
  email: string;
  role: string;
};

export default function CreateTaskScreen() {
  const params = useLocalSearchParams<{ project_id: string; team_id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [assign, setAssign] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string; id: number }[]>([]);
  const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof params.team_id === 'string') {
        const members = await getTeamMembers(+params.team_id);
        if (Array.isArray(members)) {
          setItems(
            members.map((m: TeamMember) => ({
              label: m.username,
              value: m.username,
              id: m.user_id,
            }))
          );
        }
      }
    })();
  }, [params.team_id]);

  const handleCreateTask = async () => {
    const userID = await getUserId();
    const nameEmpty = !taskName.trim();
    const descEmpty = !description.trim();
    const deadlineEmpty = !deadline.trim();

    if (nameEmpty || descEmpty || deadlineEmpty || !userID) {
      setErrors({ name: nameEmpty, description: descEmpty });
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const assignedToId = items.find((i) => i.label === assign)?.id ?? null;

      const response = await fetch(`http://${ipAddr}:5000/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: taskName,
          deadline,
          description,
          assign: assignedToId,
          project_id: params.project_id,
          parent_task_id: null,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error('Permission denied');
        if (response.status === 401) throw new Error('Not authenticated');
        const err = await response.json();
        throw new Error(err.message || 'Failed to create task');
      }

      const existing = await AsyncStorage.getItem('tasks');
      const arr = existing ? JSON.parse(existing) : [];
      arr.push({ name: taskName, deadline, description, assign: assignedToId, project_id: params.project_id });
      await AsyncStorage.setItem('tasks', JSON.stringify(arr));

      router.replace({
        pathname: './projects',
        params: { project_id: params.project_id, team_id: params.team_id },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background, position: 'relative' },
      ]}
    >
      <TopBar />
      <Text style={[styles.title, { color: theme.text }]}>Create new Task</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Task header"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.text },
            errors.name && styles.inputError,
          ]}
          value={taskName}
          onChangeText={(t) => {
            setTaskName(t);
            if (errors.name && t.trim()) setErrors((p) => ({ ...p, name: false }));
          }}
        />
        {errors.name && <Text style={styles.errorIcon}>❌</Text>}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Task description"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.text },
            errors.description && styles.inputError,
          ]}
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            if (errors.description && t.trim()) setErrors((p) => ({ ...p, description: false }));
          }}
        />
        {errors.description && <Text style={styles.errorIcon}>❌</Text>}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Deadline (YYYY-MM-DD)"
          placeholderTextColor={theme.text}
          style={[styles.input, { color: theme.text, borderColor: theme.text }]}
          value={deadline}
          onChangeText={setDeadline}
        />
      </View>

      <View style={[styles.inputRow, { zIndex: 1000 }]}>
        <DropDownPicker
          open={open}
          value={assign}
          items={items}
          setOpen={setOpen}
          setValue={setAssign}
          setItems={setItems}
          placeholder="Select a team member"
          style={[
            styles.dropdown,
            { backgroundColor: theme.card, borderColor: theme.text },
          ]}
          textStyle={{ fontSize: 16, color: theme.text }}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { backgroundColor: theme.card, borderColor: theme.text },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateTask}
        disabled={isLoading}
      >
        <Text style={styles.createButtonText}>Create Task</Text>
      </TouchableOpacity>


      <LoadingOverlay visible={isLoading} />

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  inputError: {
    borderColor: 'red',
  },
  errorIcon: {
    marginLeft: 5,
    color: 'red',
    fontSize: 18,
  },
  createButton: {
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  dropdown: {
    borderRadius: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    width: '90%',
    alignSelf: 'center',
  },
  dropdownContainer: {
    width: '90%',
    alignSelf: 'center',
  },
});
