import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { getTeamMembers, getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeContext';

export default function CreateProjectScreen() {
  const params = useLocalSearchParams();
  const [taskName, setTaskName] = useState('');
  const [deadline, setdeadline] = useState('');
  const [description, setDescription] = useState('');
  const [assign, setassign] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string; id: number }[]>([]);
  const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [loading, setLoading] = useState(false); // New loading state
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    (async () => {
      if (typeof params.team_id === 'string') {
        const members = await getTeamMembers(parseInt(params.team_id, 10));
        if (Array.isArray(members)) {
          setItems(
            members.map((member) => ({
              label: `${member.username}`,
              value: member.username,
              id: member.user_id,
            }))
          );
        } else {
          console.error('Invalid team members data:', members);
        }
      }
    })();
  }, []);

  const handleCreateTask = async () => {
    setLoading(true); 
    const userID = await getUserId();
    let assignedToId = items.find(item => item.label === assign)?.id;
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

    try {
      const response = await fetch(`http://${ipAddr}:5000/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: taskName,
          deadline: deadline,
          description: description,
          assign: assignedToId,
          project_id: params.project_id,
          parent_task_id: params.parent_id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const existing = await AsyncStorage.getItem('tasks');
        const existingTasks = existing ? JSON.parse(existing) : [];
        const newTask = {
          name: taskName,
          deadline: deadline,
          description: description,
          assign: assignedToId,
          project_id: params.project_id,
          parent_task_id: null,
        };
        await AsyncStorage.setItem('tasks', JSON.stringify([...existingTasks, newTask]));

        setTimeout(() => {
          setLoading(false); 
          router.back();
        }, 2000);
      } else if (response.status === 403) {
        Alert.alert('Error', 'You don’t have permission for that.');
        setLoading(false);

      } else if (response.status === 401) {
        setLoading(false);
        Alert.alert('Error', 'We couldn’t authenticate you.');
      } else {
        setLoading(false);
        Alert.alert('Error', data.message || 'Failed to create task.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong!');
      console.error(error);
      setLoading(false);
    } 
  };

  if(loading){
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary, flex: 1 ,width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={theme.text} />
      <Text style={[styles.loadingText, { color: theme.text }]}>Creating Task...</Text>
    </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
     
      <TopBar />
      {!loading && (
        <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.title, { color: theme.text }]}>Create new Task</Text>

             <View style={styles.inputRow}>
             <TextInput
               placeholder="Task headder"
               placeholderTextColor={theme.text}
               style={[
                 styles.input,
                 { color: theme.text, borderColor: theme.text },
                 errors.name && styles.inputError,
               ]}
               value={taskName}
               onChangeText={(text) => {
                 setTaskName(text);
                 if (errors.name && text.trim()) {
                   setErrors((prev) => ({ ...prev, name: false }));
                 }
               }}
             />
             {errors.name && <Text style={[styles.errorIcon, { color: 'red' }]}>❌</Text>}
           </View>
     
           <View style={styles.inputRow}>
             <TextInput
               placeholder="Task description"
               placeholderTextColor={theme.text}
               style={[
                 styles.input,
                 { color: theme.text, borderColor: theme.text },
                 errors.name && styles.inputError,
               ]}
               value={description}
               onChangeText={(text) => {
                 setDescription(text);
                 if (errors.name && text.trim()) {
                   setErrors((prev) => ({ ...prev, name: false }));
                 }
               }}
             />
             {errors.name && <Text style={[styles.errorIcon, { color: 'red' }]}>❌</Text>}
           </View>
     
           <View style={styles.inputRow}>
             <TextInput
               placeholder="Deadline (YYYY-MM-DD)"
               placeholderTextColor={theme.text}
               style={[
                 styles.input,
                 { color: theme.text, borderColor: theme.text },
                 errors.description && styles.inputError,
               ]}
               value={deadline}
               onChangeText={(text) => {
                 setdeadline(text);
                 if (errors.description && text.trim()) {
                   setErrors((prev) => ({ ...prev, description: false }));
                 }
               }}
             />
             {errors.description && <Text style={[styles.errorIcon, { color: 'red' }]}>❌</Text>}
           </View>
     
           <View style={[styles.inputRow, { zIndex: 1000 }]}>
             <DropDownPicker
               open={open}
               value={assign}
               items={items}
               setOpen={setOpen}
               setValue={setassign}
               setItems={setItems}
               placeholder="Select a team member"
               style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.text }]}
               textStyle={{
                 fontSize: 16,
                 color: theme.text,
               }}
               dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.text }]}
             />
           </View>
     
           <TouchableOpacity style={[styles.createButton, { backgroundColor: theme.primary }]} onPress={handleCreateTask}>
             <Text style={styles.createButtonText}>Create Task</Text>
           </TouchableOpacity>
        </View>
      )}

 



      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backButton: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: -30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    width: '90%',
    padding: 10,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
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
    backgroundColor: '#70ABAF',
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
  toastCenter: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: '#ddd',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    width: '90%',
    alignSelf: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    width: '90%',
    alignSelf: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
