import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, TextInput, FlatList, ScrollView, ProgressBarAndroid } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ipAddr } from "@/components/backendip";
import { MaterialIcons } from '@expo/vector-icons';
import { getTeamMembers } from "@/components/getUser";
import { useFocusEffect } from '@react-navigation/native';
import React from "react";
import * as Speech from 'expo-speech';

const TaskScreen = () => {
    const params = useLocalSearchParams();
    const [assignedMember, setAssignedMember] = useState<string | null>(null);
    const [tasks, setTasks] = useState<{id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean, parent_task_id: number}[]>([]);
    
    const text = "Hello, this is native speech synthesis. You are on the task screen. The task name is " + params.task_name + " and it is assigned to " + assignedMember + ".";

    const speak = () => {
      Speech.speak(text, {
        language: 'en-US', 
        pitch: 1.0,
        rate: 1.0,
      });
    };

    useEffect(() => {
            (async () => {

                if (typeof params.team_id === 'string') {
                    const members = await getTeamMembers(parseInt(params.team_id, 10));
                    if (Array.isArray(members)) {

                        const assigned = members.find(
                          (member) => member.user_id === parseInt(Array.isArray(params.task_assigned_to) ? params.task_assigned_to[0] : params.task_assigned_to, 10)
                        );
                        setAssignedMember(assigned ? assigned.username : ' --');
                       
                    } else {
                        console.error('Invalid team members data:', members);
                    }
                }
            })();
            speak();
        }, []);

    useFocusEffect(
      React.useCallback(() => {
      const fetchProjectTasks = async () => {
        try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(`http://${ipAddr}:5000/getProjectTasks?projectID=${params.project_id}`, {
          headers: {
          'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setTasks(data);
        }
        } catch (error) {
        console.error("Error fetching project tasks:", error);
        }
      };
    
      fetchProjectTasks();
      }, [params.project_id])
    );
    
    const TaskItem = ({ task }: { task: { id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean; parent_task_id: number } }) => {
      const [checked, setChecked] = useState(task.completed);

      async function modifyTaskStatus(task: { id: number; completed: boolean }) {
      const token = await AsyncStorage.getItem('authToken');
      try {
        const updateTaskAndSubtasks = async (taskId: number, completed: boolean) => {
          const response = await fetch(`http://${ipAddr}:5000/modifyTaskStatus`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              task_id: taskId,
              completed: completed,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to modify task status on the server.');
          }
          if(completed){
            tasks.forEach((t) => {
              if (t.parent_task_id === taskId) {
                t.completed = completed;
                updateTaskAndSubtasks(t.id, completed);
              }
            });
          }
          
        };

        await updateTaskAndSubtasks(task.id, !task.completed);
        toggleCheckbox();
      } catch (error) {
        console.error('Error modifying task status:', error);
      }
      }

      const toggleCheckbox = () => {
      setChecked(!checked);
      task.completed = !checked;

      const updateSubtasks = (parentTaskId: number, completed: boolean) => {
        tasks.forEach((t) => {
        if (t.parent_task_id === parentTaskId) {
          t.completed = completed;
          updateSubtasks(t.id, completed); 
        }
        });
      };

      task.completed = !checked;
      if(task.completed) {
        updateSubtasks(task.id, task.completed);
      }
      };

      return (
      <TouchableOpacity onPress={() => router.push({ pathname: '/inApp/taskScreen', params: {team_name: params.team_name,project_id: params.project_id, team_id: params.team_id, task_id: task.id, task_name: task.name, task_description: task.description, task_assigned_to: task.assigned_to, task_deadline: task.deadline ? task.deadline.toString() : '', task_completed: task.completed ? task.completed.toString() : '', user_id: params.user_id  }})}
      style={styles.taskContainer}
      >
        <TouchableOpacity
        style={[styles.checkbox, checked && { backgroundColor: 'gray' }]}
        onPress={() => modifyTaskStatus(task)}
        >
        {checked && <Ionicons name="checkmark" size={16} color="white" />}
        </TouchableOpacity>
        <Text style={styles.taskText}>{task.name}</Text>
        {task.assigned_to === Number(params.user_id) && (<Ionicons name="person-outline" size={24} color="black" />)}
      </TouchableOpacity>
      );
    };

  return (
        <SafeAreaView style={styles.MainContainer}>
            <TopBar />
                <View style={[styles.container]}>
                    <Text style={styles.title}>{params.team_name}</Text>

                    <Text style={styles.header}>{params.task_name}</Text>
                

                    <View style={styles.assignContainer}>
                        <MaterialIcons name="account-circle" size={30} color="black" />
                        <Text style={styles.assignedText}>Assigned to: {assignedMember}</Text>
                    </View>
                   
                    <View style={{width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start'}}><Text style={[styles.subHeader]}>Description</Text></View>
                    <Text style={styles.description}>
                        {params.task_description}
                    </Text>
                    
                    <Text style={styles.subHeader}>Subtasks</Text>
                    <View style={{ flex: 1 }}>
                      <FlatList
                        data={tasks.filter(task => task.parent_task_id === Number(params.task_id))}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                          <TaskItem task={item} />
                        )}
                        contentContainerStyle={{ padding: 16 }}
                      />
                    </View>
                    <View style={[styles.statusContainer, { marginBottom: 80 }]}>
                      <Text style={styles.statusText}>Status: </Text>
                      <Text
                      style={[
                        styles.statusText,
                        params.task_completed === 'true' ? { color: 'green' } : styles.notCompleted,
                      ]}
                      >
                      {params.task_completed === 'true' ? 'Completed' : 'Not completed'}
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
      progressBarContainer: {
        marginTop: 10,
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
      notCompleted: {
        color: 'red',
      },
      headerRow: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcdcdc', // svetlosivá
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
});

export default TaskScreen;
