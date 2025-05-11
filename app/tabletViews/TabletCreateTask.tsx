import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import { addToQueue } from '@/components/queue';
import NetInfo from '@react-native-community/netinfo';
import io from 'socket.io-client';
export default function CreateProjectScreenTablet() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assign, setAssign] = useState<string | null>(null);
  const [items, setItems] = useState<{ label: string; value: string; id: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: false, description: false });

  useEffect(() => {
    (async () => {
      if (typeof params.team_id === 'string') {
        const cached = await AsyncStorage.getItem(`teamMembers_${params.team_id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const members = parsed;
          if (Array.isArray(members)) {
            setItems(
              members.map((member) => ({
                label: `${member.username}`,
                value: member.username,
                id: member.user_id,
              }))
              
            );
            console.log(items)
          } else {
            console.error('Invalid team members data:', members);
          }
          console.log("Team members loaded from cache.");
        } else {
          console.warn("No cached team members found.");
        }

      }
    })();
  }, []);

  
const handleCreateTask = async () => {
  setLoading(true); 
  const userID = await getUserId();
  const assignedToId = items.find(item => item.label === assign)?.id;
  const nameEmpty = !taskName.trim();
  const descEmpty = !description.trim();
  const deadlineEmpty = !deadline.trim();
  const token = await AsyncStorage.getItem('authToken');

  if (nameEmpty || descEmpty || deadlineEmpty || !userID) {
    setErrors({
      name: nameEmpty,
      description: descEmpty,
    });
    setLoading(false); 
    return;
  }

  const newTask = {
    id: `local-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: taskName,
    deadline,
    description,
    assign: assignedToId,
    project_id: params.project_id,
    parent_task_id: params.parent_id || null,
  };

  const state = await NetInfo.fetch();

  if (state.isConnected) {
    try {
      const response = await fetch(`http://${ipAddr}:5000/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      const data = await response.json();

      if (response.ok) {
        const existing = await AsyncStorage.getItem('tasks');
        const existingTasks = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem('tasks', JSON.stringify([...existingTasks, newTask]));

        setTimeout(() => {
          setLoading(false); 
          router.back();
        }, 2000);
      } else if (response.status === 403) {
        Alert.alert('Error', 'You don’t have permission for that.');
        setLoading(false);
      } else if (response.status === 401) {
        Alert.alert('Error', 'We couldn’t authenticate you.');
        setLoading(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to create task.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong!');
      console.error(error);
      setLoading(false);
    }
  } else {
    const key = `tasks_${params.project_id}`;
    const existing = await AsyncStorage.getItem(key);
    const existingTasks = existing ? JSON.parse(existing) : [];
    await AsyncStorage.setItem(key, JSON.stringify([...existingTasks, newTask]));

    addToQueue({
      url: `http://${ipAddr}:5000/createTask`,
      method: 'POST',
      body: newTask,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    Alert.alert('Offline Mode', 'Task saved locally and will sync when online.');
    setLoading(false);
    router.back();
  }
};

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Creating Task...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />
      <Text style={[styles.title, { color: theme.text }]}>Create New Task</Text>
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <View style={[styles.inputWrapper, {borderColor: theme.text}]}>
            <MaterialIcons name="title" size={20} color={theme.text} style={styles.icon} />
            <TextInput
              placeholder="Task name"
              placeholderTextColor={theme.text}
              style={[styles.input, { color: theme.text }]}
              value={taskName}
              onChangeText={(text) => {
                setTaskName(text);
                if (errors.name && text.trim()) {
                  setErrors((prev) => ({ ...prev, name: false }));
                }
              }}
            />
          </View>
          <View style={[styles.inputWrapper, {borderColor: theme.text}]}>
            <MaterialIcons name="notes" size={20} color={theme.text} style={styles.icon} />
            <TextInput
              placeholder="Description"
              placeholderTextColor={theme.text}
              style={[styles.input, { color: theme.text }]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description && text.trim()) {
                  setErrors((prev) => ({ ...prev, description: false }));
                }
              }}
            />
          </View>
          <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateTask}
            >
        <Text style={styles.createButtonText}>Create Task</Text>
      </TouchableOpacity>
        </View>
        <View style={styles.formColumn}>
          <View style={[styles.inputWrapper, {borderColor: theme.text}]}>
            <MaterialIcons name="calendar-today" size={20} color={theme.text} style={styles.icon} />
            <TextInput
              placeholder="Deadline (YYYY-MM-DD)"
              placeholderTextColor={theme.text}
              style={[styles.input, { color: theme.text }]}
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
          <View style={{ width: '90%', marginBottom: 15, zIndex: 1000 }}>
            <DropDownPicker
              open={open}
              value={assign}
              items={items}
              setOpen={setOpen}
              setValue={setAssign}
              setItems={setItems}
              placeholder="Assign to..."
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.text,
                  height: 48,
                  paddingHorizontal: 10,
                },
              ]}
              textStyle={{ color: theme.text }}
              dropDownContainerStyle={{
                backgroundColor: theme.card,
                borderColor: theme.text,
                zIndex: 1000,
              }}
            />
          </View>
        </View>
      </View>

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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 20,
  },
  formColumn: {
    flex: 1,
    alignItems: 'center',
  },
  inputWrapper: {
    width: '90%',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,

  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  dropdown: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
  },
  createButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    width: '50%',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
