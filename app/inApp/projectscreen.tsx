import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ipAddr } from "@/components/backendip";
import { useFocusEffect } from '@react-navigation/native';
import React from "react";


const TeamScreen = () => {
    const params = useLocalSearchParams();
    const [teamMembers,setTeamMembers] = useState<{user_id:number; username:string; email:string; role:string}[]>([]);
    const [tasks, setTasks] = useState<{id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean, parent_task_id: number}[]>([]);
    const [progress, setProgress] = useState(0);
    function calculate_percentage(tasks:{completed: boolean}[]){
        let completed = 0;
        tasks.forEach((task) => {
            if (task.completed) {
                completed++;
            }
        });
        return (completed / tasks.length) * 100;
    }

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
          const sortedTasks = data.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          });
          setTasks(sortedTasks);
          setProgress(calculate_percentage(sortedTasks));
        }
        } catch (error) {
        console.error("Error fetching project tasks:", error);
        }
      };
    
      fetchProjectTasks();
      }, [params.project_id])
    );
    
      
  
    const SubTaskItem = ({ task }: { task: { id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean } }) => {
        const [checked, setChecked] = useState(task.completed);
        return (
            <TouchableOpacity
              style={styles.subtaskContainer}
              onPress={() => setChecked(!checked)}
            >
              <Text style={styles.taskText}>{task.name}</Text>
              {task.assigned_to === Number(params.user_id) && (<Ionicons name="person-outline" size={24} color="black" />
              )}    
            </TouchableOpacity>
          );
      };

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

        if (response.status === 403) {
          alert('You don\'t have permission for that.');
          return false;
        }

        if (response.status === 401) {
          alert('We couldn\'t authenticate you.');
          return false;
        }

        if (!response.ok) {
          alert('Failed to modify task status on the server.');
          return false;
        }

          if (completed) {
        tasks.forEach((t) => {
          if (t.parent_task_id === taskId) {
        t.completed = completed;
        updateTaskAndSubtasks(t.id, completed);
          }
        });
          }
          return true;
        };

        const success = await updateTaskAndSubtasks(task.id, !task.completed);
        if (success) {
          toggleCheckbox();
        }
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
      setProgress(calculate_percentage(tasks));
      };

      return (
      <TouchableOpacity onPress={() => router.push({ pathname: '/inApp/taskScreen', params: {team_name: params.team_name,project_id: params.project_id, team_id: params.team_id, task_id: task.id, task_name: task.name, task_description: task.description, task_assigned_to: task.assigned_to, task_deadline: task.deadline ? task.deadline.toString() : '', task_completed: task.completed ? task.completed.toString() : '', user_id: params.user_id }})}
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
    <Text style={styles.mainText}>{params.team_name}</Text>
    <View style={styles.MainContainer}>
        <View style={styles.headerRow}>
            <FontAwesome name="tasks" size={32} color="black" style={{ maxWidth: '30%' }} />
            <Text style={[styles.SmolText, { paddingLeft: 10 }]}>{params.project_name}</Text>
            <View style={{ maxWidth: '70%', width: '70%' }}>
                <View style={styles.container}>
                    <View style={styles.progressBackground}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.text}>{progress}%</Text>
                </View>
            </View>
        </View>
        <View style={styles.headerRow}>
          <TouchableOpacity
                    onPress={() => router.push({ pathname: '/inApp/createTaskScreen', params: {project_id: params.project_id, team_id: params.team_id }})}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <FlatList
            style={{ width: "100%" }}
            data={tasks.filter(task => task.parent_task_id == null)}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View>
                    <TaskItem task={item} />
                    {tasks
                        .filter(subtask => subtask.parent_task_id === item.id)
                        .map(subtask => (
                            <View key={subtask.id} style={{ marginLeft: 50 }}>
                                <SubTaskItem task={subtask} />
                            </View>
                        ))}
                </View>
            )}
            contentContainerStyle={{ padding: 16 }}
        />
    </View>
    <BottomBar />
</SafeAreaView>
  );
};


const styles = StyleSheet.create({
    MainContainer: {
        padding: 10,
        flex: 1,
        width: "100%",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
    },
    SmolText: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 10,
        fontWeight: "800",
        color: "#333",
        textAlign: "left",
    },
    headerRow: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addButton: {
        backgroundColor: "#70ABAF",
        padding: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    mainText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#222",
        textAlign: "center",
        marginBottom: 10,
    },
    teamButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    teamButtonText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: "#444",
    },
    noTeamsText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    teamList: {
        width: "90%",
        marginTop: 10,
        marginBottom: 20,
    },
    memberBlock: {
        width: '80%',
        padding: 10,
        borderRadius: 8,
        marginVertical: 5,
        marginLeft: '10%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    member: {
        fontSize: 16,
        fontWeight: "500",
        color: "black",
    },
    memberRole: {
        color: 'gray',

    },
    container: {
        alignItems: 'center',
        margin: 20,
      },
      progressBackground: {
        width: 200,
        height: 20,
        backgroundColor: '#d3d3d3', // svetlosivá
        borderRadius: 10,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        backgroundColor: 'gray',
        borderRadius: 10,
      },
      text: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '500',
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
      subtaskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcdcdc', 
        padding: 10,
        borderColor: '#333',
        justifyContent: 'space-between',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
      }
});

export default TeamScreen;
