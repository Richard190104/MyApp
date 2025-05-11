import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, FlatList, Modal, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ipAddr } from "@/components/backendip";
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React from "react";
import * as Speech from 'expo-speech';
import { useTheme } from '@/components/ThemeContext';
import { Dimensions } from "react-native";
import  TabletTaskScreen from "@/app/tabletViews/TabletTask";
import { useWindowDimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import io from 'socket.io-client';
import { addToQueue } from "@/components/queue";

const TaskScreen = () => {
  const { width } = useWindowDimensions();

  const isTablet = Dimensions.get('window').width >= 768;
  const params = useLocalSearchParams();
  const [assignedMember, setAssignedMember] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean, parent_task_id: number}[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const taskId = Number(Array.isArray(params.task_id) ? params.task_id[0] : params.task_id);
  const [showRoleOptions, setShowRoleOptions] = useState<{ [key: string]: boolean }>({});
  const [members, setMembers] = useState<{ user_id: number; username: string; role: string }[]>([]);
  const { theme, toggleTheme } = useTheme();
  const [newMessage, setNewMessage] = useState('');
  const socket = io(`http://${ipAddr}:5000`);
  type Task = {
    id: number | string;
    name: string;
    description: string;
    assigned_to: number;
    deadline: string | Date;
    completed: boolean;
    parent_task_id: number | null;
  };
  
  const speak = (text: string) => {
    
    Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 1.0 });
  };

  const speakDescription = () => {
    const taskName = Array.isArray(params.task_name) ? params.task_name[0] : (params.task_name as string || '');
    const deadlineRaw = Array.isArray(params.task_deadline) ? params.task_deadline[0] : (params.task_deadline as string || '');
    const assignedUser = assignedMember || 'no one';
    const descriptionText = Array.isArray(params.task_description)
      ? params.task_description[0]
      : (params.task_description as string || '');

    let deadlineReadable = deadlineRaw;
    if (deadlineRaw) {
      const deadlineDate = new Date(deadlineRaw);
      deadlineReadable = deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const text = `This is ${taskName} task. Task is due on ${deadlineReadable}, and is assigned to ${assignedUser}. Its description is: ${descriptionText}`;

    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
    });
  };



  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {

    const loadMembers = async () => {
      if (typeof params.team_id === 'string') {
        try {
          const stored = await AsyncStorage.getItem(`teamMembers_${params.team_id}`);
          if (stored) {
            const parsedMembers = JSON.parse(stored) as { user_id: number; username: string; role: string }[];
            setMembers(parsedMembers);
    
            const assigned = parsedMembers.find(
              (member) =>
                member.user_id ===
                parseInt(
                  Array.isArray(params.task_assigned_to)
                    ? params.task_assigned_to[0]
                    : params.task_assigned_to,
                  10
                )
            );
            setAssignedMember(assigned ? assigned.username : '--');
    
            const currentUser = parsedMembers.find(
              (member) =>
                member.user_id ===
                parseInt(
                  Array.isArray(params.user_id)
                    ? params.user_id[0]
                    : params.user_id,
                  10
                )
            );
            setUserRole(currentUser ? currentUser.role : null);
          } else {
            setMembers([]);
            setAssignedMember('--');
          }
        } catch (err) {
          console.error('Failed to load team members', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
  
    loadMembers();
  }, []);
  

  useFocusEffect(
    React.useCallback(() => {
      const fetchProjectTasks = async () => {
        const state = await NetInfo.fetch();
        const token = await AsyncStorage.getItem('authToken');
  
        if (state.isConnected) {
          console.log("Internet is connected. Fetching project tasks from backend...");
          try {
            const response = await fetch(`http://${ipAddr}:5000/getProjectTasks?projectID=${params.project_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
              setTasks(data);
              await AsyncStorage.setItem(`tasks_${params.project_id}`, JSON.stringify(data));
              console.log("Project tasks fetched and stored locally.");
            }
          } catch (error) {
            console.error("Error fetching project tasks:", error);
          }
        } else {
          console.log("No internet connection. Trying to load tasks from cache...");
          try {
            const cached = await AsyncStorage.getItem(`tasks_${params.project_id}`);
            console.log(cached)
            

            if (cached) {
              const tasks = JSON.parse(cached);
              setTasks(tasks);
              console.log("Current taskId:", taskId);
              console.log("Filtered subtasks:", tasks.filter((task: any) => String(task.parent_task_id) === String(taskId)));
              console.log("Project tasks loaded from cache.");
            } else {
              console.warn("No cached tasks found.");
              setTasks([]);
            }
          } catch (error) {
            console.error("Error loading tasks from cache:", error);
          }
        }
      };
  
      fetchProjectTasks();
    }, [params.project_id])
  );
  
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    socket.emit('send_message', {
      sender_id: 50,
      team_id: params.team_id,
      content: newMessage,
    });
  }

async function handleCheckboxPress(taskId: number, completed: boolean, name: String) {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const state = await NetInfo.fetch();

    const key = `tasks_${params.project_id}`;
    const stored = await AsyncStorage.getItem(key);
    const parsedTasks = stored ? JSON.parse(stored) : [];

    const updatedTasks = parsedTasks.map((task: any) =>
      task.id === taskId ? { ...task, completed } : task
    );



    if (state.isConnected) {
      const response = await fetch(`http://${ipAddr}:5000/modifyTaskStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          completed,
        }),
      });

      if (!response.ok) {
        if(response.status == 403){
            Alert.alert('Error', 'You don’t have permission for that.');
        }
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      else{
        await AsyncStorage.setItem(key, JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
         setNewMessage(`Changed status of task: ${name} to ${completed}`);
        sendMessage();
      }
     
    } else {
      addToQueue({
        url: `http://${ipAddr}:5000/modifyTaskStatus`,
        method: 'PUT',
        body: {
          task_id: taskId,
          completed,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Offline Mode', 'Task status updated locally and will sync when online.');
      setTasks(updatedTasks);
      await AsyncStorage.setItem(key, JSON.stringify(updatedTasks));

    }
  } catch (error) {
    console.error('Error toggling task status:', error);
  }
}



  const TaskItem = ({ task }: { task: { id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean; parent_task_id: number } }) => {
    return (
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/inApp/taskScreen', params: { ...params, task_id: task.id, task_name: task.name, task_description: task.description, task_assigned_to: task.assigned_to, task_deadline: task.deadline ? task.deadline.toString() : '', task_completed: task.completed.toString() } })}
        style={[styles.taskContainer, { backgroundColor: theme.card }]}
      >
        <TouchableOpacity
          style={[styles.checkbox, task.completed && { backgroundColor: theme.card }]}
          onPress={async () => await handleCheckboxPress(task.id, !task.completed, task.name)}
        >
          {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
        </TouchableOpacity>
        <Text style={[styles.taskText, {color: theme.text}]}>{task.name}</Text>
        {task.assigned_to === Number(params.user_id) && (<Ionicons name="person-outline" size={24} color="black" />)}
      </TouchableOpacity>
    );
  };

  const mainTask = tasks.find((t) => t.id === taskId);


  async function modifyTaskAssignedTo(taskId: number, assignedTo: number) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('User is not authenticated');
      }

      const response = await fetch(`http://${ipAddr}:5000/modifyTaskAssignedTo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          assigned_to: assignedTo,
        }),  
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const updatedTask = await response.json();

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, assigned_to: assignedTo } : task
        )
      );

      const assignedMber = members.find((member) => member.user_id === assignedTo);
      setAssignedMember(assignedMber ? assignedMber.username : '--');

    } catch (error) {
      console.error('Error modifying task assignment:', error);
    }
  }

  type TaskType = {
    id: number;
    name: string;
    description: string;
    assigned_to: number;
    deadline: Date;
    completed: boolean; 
    parent_task_id: number;
  };
  if (isTablet) {
    if (isLoading || assignedMember === null || !mainTask) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
          <Text style={{ color: theme.text }}>Loading...</Text>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <TopBar />
        <TabletTaskScreen 
          task={mainTask}
          subtasks={tasks.filter(task => String(task.parent_task_id) === String(taskId))}
          assignedMember={assignedMember}
          onAssignPress={() => setShowRoleOptions({ [String(params.task_assigned_to)]: true })}
          onToggleTask={handleCheckboxPress}
          onSubtaskPress={(task: TaskType) => {
            
            router.push({
              pathname: '/inApp/taskScreen',
              params: { ...params, task_id: task.id, task_name: task.name, task_description: task.description, task_assigned_to: task.assigned_to, task_deadline: task.deadline ? task.deadline.toString() : '', task_completed: task.completed.toString() }
            });
          }}
          onCreateSubtask={() => router.push({
            pathname: '/inApp/createTaskScreen',
            params: { project_id: params.project_id, team_id: params.team_id, parent_id: taskId }
          })}
          showAssignmentModal={showRoleOptions[String(params.task_assigned_to)]}
          members={members}
          onAssignTo={modifyTaskAssignedTo}
          onCloseModal={() => setShowRoleOptions({})}
          userRole={userRole}
          userId={Number(params.user_id)}
          taskAssignedTo={Number(params.task_assigned_to)}
        />
        <BottomBar />
      </SafeAreaView>
    );
  }
  
  

  return (
    <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background }]}>
  <TopBar />
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <Text style={[styles.title, { color: theme.text }]}>{params.team_name}</Text>

    <Text style={[styles.header, { color: theme.text }]}>{params.task_name}</Text>

    <View style={styles.assignContainer}>
      <MaterialIcons name="account-circle" size={30} color={theme.text} />
      <Text style={[styles.assignedText, { color: theme.text }]}>Assigned to: {assignedMember}</Text>

      {(userRole === 'owner' || userRole === 'admin' || params.user_id === params.task_assigned_to) && (
        <TouchableOpacity onPress={() => setShowRoleOptions(prevState => ({ ...prevState, [String(params.task_assigned_to)]: true }))} style={{ marginLeft: 10 }}>
          <FontAwesome name="pencil" size={24} color={theme.text} />
        </TouchableOpacity>
      )}

      {showRoleOptions[String(params.task_assigned_to)] && (
        <Modal
          transparent
          visible={showRoleOptions[String(Array.isArray(params.task_assigned_to) ? params.task_assigned_to[0] : params.task_assigned_to)]}
          animationType="slide"
          onRequestClose={() => setShowRoleOptions(prevState => ({ ...prevState, [String(params.task_assigned_to)]: false }))}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Assign task to a team member</Text>
              {typeof params.team_id === 'string' && (
                <FlatList
                  data={members}
                  keyExtractor={(item) => item.user_id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={async () => {
                        modifyTaskAssignedTo(taskId, item.user_id);
                        setShowRoleOptions(prevState => ({ ...prevState, [String(params.task_assigned_to)]: false }));
                      }}
                      style={[styles.optionButton, { backgroundColor: theme.primary }]}
                    >
                      <Text style={{ color: 'white' }}>{item.username}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              <TouchableOpacity onPress={() => setShowRoleOptions({})}>
                <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
    <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
      <Text style={[styles.subsubHeader, { color: theme.text, marginBottom: 0 }]}>Deadline: </Text>
    </View>
    <Text style={[styles.description, { color: theme.text, fontSize: 12 , marginVertical: 0 }]}>{params.task_deadline}</Text>
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      width: '100%',
      marginBottom: 10
    }}>
      <Text style={[styles.subHeader, { color: theme.text }]}>Description</Text>
      <TouchableOpacity onPress={speakDescription}>
        <Ionicons name="volume-high" size={24} color={theme.primary} />
      </TouchableOpacity>
    </View>
    <Text style={[styles.description, { color: theme.text }]}>{params.task_description}</Text>

    <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}>  
    <Text style={[styles.subHeader, { color: theme.text }]}>Subtasks</Text>
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/inApp/createTaskScreen', params: { project_id: params.project_id, team_id: params.team_id, parent_id: taskId} })}
      style={[styles.addButton, { backgroundColor: theme.primary }]}
    >
        <Ionicons name="add" size={15} color="white" />
    </TouchableOpacity>
    </View>
    <FlatList
      data={tasks.filter(task => String(task.parent_task_id) === String(taskId))}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => <TaskItem task={item} />}
      contentContainerStyle={{ padding: 16 }}
    />

    <View style={[styles.statusContainer, { marginBottom: 80 }]}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          { borderColor: theme.text },
          mainTask?.completed && { backgroundColor: theme.primary }
        ]}
        onPress={async () => {
          if (mainTask) {
            await handleCheckboxPress(mainTask.id, !mainTask.completed, mainTask.name);
          }
        }}
      >
        {mainTask?.completed && <Ionicons name="checkmark" size={16} color="white" />}
      </TouchableOpacity>
      <Text style={[styles.statusText, { color: theme.text }]}>
        {mainTask?.completed ? 'Task is completed' : 'Task is not completed'}
      </Text>
    </View>
  </View>
  <BottomBar />
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  MainContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  optionButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    minWidth: '80%',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginTop: 10,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  subsubHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  assignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  assignedText: {
    fontSize: 16,
    marginLeft: 10,
  },
  description: {
    fontSize: 16,
    marginVertical: 10,
    color: 'gray',
    width: '100%',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcdcdc',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'space-between',
    borderBottomRightRadius: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'white',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
},
});

export default TaskScreen;