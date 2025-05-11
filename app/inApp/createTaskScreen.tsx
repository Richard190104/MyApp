import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { router, useLocalSearchParams } from 'expo-router';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeContext';
import CreateProjectScreenTablet from '../tabletViews/TabletCreateTask';
import { addToQueue } from '@/components/queue';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchStatus, BackgroundFetchResult } from 'expo-background-fetch';

const TASK_NAME = 'BACKGROUND_FETCH_DEADLINE_CHECK';

TaskManager.defineTask(TASK_NAME, async () => {
  const startTime = Date.now();
  let notificationCount = 0;

  try {
    const raw = await AsyncStorage.getItem('tasks');
    const tasks = raw ? JSON.parse(raw) : [];

    const now = Date.now();
    let updated = false;

    for (let t of tasks) {
      if (t.createdAt && now - t.createdAt >= 60000 && !t.notified) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Deadline incoming!',
            body: `Task "${t.name}" has a deadline: ${t.deadline}`,
            data: { task: t },
          },
          trigger: null,
        });
        t.notified = true;
        updated = true;
        notificationCount++;
      }
    }

    if (updated) {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    }

    const duration = Date.now() - startTime;

    console.log(`[Metrics] Background task: ${TASK_NAME}`);
    console.log(`[Metrics] Tasks checked: ${tasks.length}`);
    console.log(`[Metrics] Notifications scheduled: ${notificationCount}`);
    console.log(`[Metrics] Duration: ${duration}ms`);

    return BackgroundFetchResult.NewData;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[Metrics] ❌ Error in ${TASK_NAME}:`, err);
    console.log(`[Metrics] Duration before error: ${duration}ms`);
    return BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundFetch() {
  const status = await BackgroundFetch.getStatusAsync();
  console.log('📡 Background fetch status:', status);

  if (status === BackgroundFetchStatus.Available) {
    try {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('✅ Background fetch registered');
    } catch (err) {
      console.error('❌ Failed to register background task:', err);
    }
  } else {
    console.warn('❌ Background fetch not available:', status);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function CreateProjectScreen() {
  const params = useLocalSearchParams();
  const isTablet = Dimensions.get('window').width >= 768;
  const [taskName, setTaskName] = useState('');
  const [deadline, setdeadline] = useState('');
  const [description, setDescription] = useState('');
  const [assign, setassign] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string; id: number }[]>([]);
  const [errors, setErrors] = useState({ name: false, description: false });
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      if (typeof params.team_id === 'string') {
        const cached = await AsyncStorage.getItem(`teamMembers_${params.team_id}`);
        if (cached) {
          const members = JSON.parse(cached);
          if (Array.isArray(members)) {
            setItems(
              members.map((member) => ({
                label: member.username,
                value: member.username,
                id: member.user_id,
              }))
            );
          }
        }
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('🔕 Notification permission not granted');
      }

      await registerBackgroundFetch();
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
      setErrors({ name: nameEmpty, description: descEmpty });
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
      completed: false,
      createdAt: Date.now(),
      notified: false,
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

        if (response.ok) {
          const existing = await AsyncStorage.getItem('tasks');
          const existingTasks = existing ? JSON.parse(existing) : [];
          await AsyncStorage.setItem('tasks', JSON.stringify([...existingTasks, newTask]));

          setTimeout(() => {
            setLoading(false);
            router.back();
          }, 2000);
        } else {
          const data = await response.json();
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
        headers: { Authorization: `Bearer ${token}` },
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

  if (isTablet) return <CreateProjectScreenTablet />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityLabel="Create task screen"
      accessibilityHint="Fill in task name, description, deadline and assignee"
      accessibilityLanguage="en-US"
    >
      <TopBar />
      <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Text
          style={[styles.title, { color: theme.text }]}
          accessibilityRole="header"
          accessibilityLabel="Create new task"
          accessibilityLanguage="en-US"
        >
          Create new Task
        </Text>

        <View
          style={styles.inputRow}
          accessible={true}
          accessibilityLabel="Task name input"
          accessibilityHint="Enter the name of the task"
          accessibilityLanguage="en-US"
        >
          <TextInput
            placeholder="Task headder"
            placeholderTextColor={theme.text}
            style={[styles.input, { color: theme.text, borderColor: theme.text }, errors.name && styles.inputError]}
            value={taskName}
            onChangeText={(text) => {
              setTaskName(text);
              if (errors.name && text.trim()) setErrors(prev => ({ ...prev, name: false }));
            }}
            accessibilityLabel="Task name"
            accessibilityRole="text"
            accessibilityLanguage="en-US"
          />
          {errors.name && (
            <Text
              style={styles.errorIcon}
              accessibilityRole="alert"
              accessibilityLabel="Task name is required"
            >
              ❌
            </Text>
          )}
        </View>

        <View
          style={styles.inputRow}
          accessible={true}
          accessibilityLabel="Task description input"
          accessibilityHint="Enter the description of the task"
          accessibilityLanguage="en-US"
        >
          <TextInput
            placeholder="Task description"
            placeholderTextColor={theme.text}
            style={[styles.input, { color: theme.text, borderColor: theme.text }, errors.description && styles.inputError]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description && text.trim()) setErrors(prev => ({ ...prev, description: false }));
            }}
            accessibilityLabel="Task description"
            accessibilityRole="text"
            accessibilityLanguage="en-US"
          />
          {errors.description && (
            <Text
              style={styles.errorIcon}
              accessibilityRole="alert"
              accessibilityLabel="Task description is required"
            >
              ❌
            </Text>
          )}
        </View>

        <View
          style={styles.inputRow}
          accessible={true}
          accessibilityLabel="Task deadline input"
          accessibilityHint="Enter the deadline in format year, month, day"
          accessibilityLanguage="en-US"
        >
          <TextInput
            placeholder="Deadline (YYYY-MM-DD)"
            placeholderTextColor={theme.text}
            style={[styles.input, { color: theme.text, borderColor: theme.text }]}
            value={deadline}
            onChangeText={(text) => setdeadline(text)}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Deadline"
            accessibilityRole="text"
            accessibilityLanguage="en-US"
          />
        </View>

        <View
          style={[styles.inputRow, { zIndex: 1000 }]}
          accessible={true}
          accessibilityLabel="Assignee dropdown"
          accessibilityHint="Select a team member to assign the task to"
          accessibilityLanguage="en-US"
        >
          <DropDownPicker
            open={open}
            value={assign}
            items={items}
            setOpen={setOpen}
            setValue={setassign}
            setItems={setItems}
            placeholder="Select a team member"
            style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.text }]}
            textStyle={{ fontSize: 16, color: theme.text }}
            dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.text }]}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateTask}
          accessibilityRole="button"
          accessibilityLabel="Create task"
          accessibilityHint="Creates a new task with the provided information"
          accessibilityLanguage="en-US"
        >
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 4, width: '90%', padding: 10, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  inputError: { borderColor: 'red' },
  errorIcon: { marginLeft: 5, color: 'red', fontSize: 18 },
  createButton: { padding: 15, borderRadius: 8, width: '90%', alignItems: 'center', marginTop: 20 },
  createButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  dropdown: { borderRadius: 4, paddingHorizontal: 12, borderWidth: 1, width: '90%', alignSelf: 'center' },
  dropdownContainer: { width: '90%', alignSelf: 'center', zIndex: 1000 },
});
