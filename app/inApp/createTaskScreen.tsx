import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { getTeamMembers, getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_FETCH_TASK = 'background-fetch-deadline-check';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const tasksString = await AsyncStorage.getItem('tasks');
    const tasks = tasksString ? JSON.parse(tasksString) : [];

    const now = new Date();

    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Deadline Reminder",
            body: `Task "${task.name}" sa blíži!`,
          },
          trigger: null,
        });
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

type TeamMember = {
    user_id: number;
    username: string;
    email: string;
    role: string;
};


export default function CreateProjectScreen() {
    const params = useLocalSearchParams();
    const [taskName, setTaskName] = useState('');
    const [deadline, setdeadline] = useState('');
    const [description, setDescription] = useState('');
    const [assign, setassign] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ label: string; value: string; id: number }[]>([]);
    const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
        name: false,
        description: false,
    });
  
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
      
          const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
          if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
              minimumInterval: 3600,  
              stopOnTerminate: false, 
              startOnBoot: true,      
            });
            console.log('Background fetch task registered');
          }
        })();
      }, []);

      const handleCreateTask = async () => {
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
              parent_task_id: null,
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
      
            setShowToast(true);
            setTimeout(() => {
              setShowToast(false);
              router.back();
            }, 2000);
          } else if (response.status === 403) {
            Alert.alert('Error', 'You don’t have permission for that.');
          } else if (response.status === 401) {
            Alert.alert('Error', 'We couldn’t authenticate you.');
          } else {
            Alert.alert('Error', data.message || 'Failed to create task.');
          }
        } catch (error) {
          Alert.alert('Error', 'Something went wrong!');
          console.error(error);
        }
      };

    return (
        <SafeAreaView style={styles.container}>
            <TopBar />
            <Text style={styles.title}>Create new Task</Text>

            <View style={styles.inputRow}>
                <TextInput
                    placeholder="Task headder"
                    style={[styles.input, errors.name && styles.inputError]}
                    value={taskName}
                    onChangeText={(text) => {
                        setTaskName(text);
                        if (errors.name && text.trim()) {
                            setErrors((prev) => ({ ...prev, name: false }));
                        }
                    }}
                />
                {errors.name && <Text style={styles.errorIcon}>❌</Text>}
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    placeholder="Task description"
                    style={[styles.input, errors.name && styles.inputError]}
                    value={description}
                    onChangeText={(text) => {
                        setDescription(text);
                        if (errors.name && text.trim()) {
                            setErrors((prev) => ({ ...prev, name: false }));
                        }
                    }}
                />
                {errors.name && <Text style={styles.errorIcon}>❌</Text>}
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    placeholder="Deadline (YYYY-MM-DD)"
                    style={[styles.input, errors.description && styles.inputError]}
                    value={deadline}
                    onChangeText={(text) => {
                        setdeadline(text);
                        if (errors.description && text.trim()) {
                            setErrors((prev) => ({ ...prev, description: false }));
                        }
                    }}
                />
                {errors.description && <Text style={styles.errorIcon}>❌</Text>}
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
                style={styles.dropdown}
                textStyle={{
                    fontSize: 16,
                    color: '#000',
                }}
                dropDownContainerStyle={styles.dropdownContainer}
                />
                </View>

            
            <TouchableOpacity style={styles.createButton} onPress={() => handleCreateTask()}>
                <Text style={styles.createButtonText}>Create Task</Text>
            </TouchableOpacity>

            {showToast && (
                <View style={styles.toastCenter}>
                    <Text style={styles.toastText}>New Task: {taskName} created!</Text>
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
    textarea: {
        height: 100,
        textAlignVertical: 'top',
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

    subTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginTop: 20,
        marginBottom: 10,
    },
    
    memberInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginBottom: 10,
    },
    
    memberInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        marginLeft: 10,
    },
    
    addButton: {
        backgroundColor: '#e0e0e0',
        padding: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    
    membersList: {
        width: '90%',
        marginBottom: 10,
    },
    
    memberItem: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
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
      

    
    
});
