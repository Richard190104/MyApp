import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, TextInput, FlatList, ScrollView, ProgressBarAndroid } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ipAddr } from "@/components/backendip";
import { MaterialIcons } from '@expo/vector-icons';
import { getTeamMembers } from "@/components/getUser";
import { useFocusEffect } from '@react-navigation/native';
import React from "react";


const TaskScreen = () => {
    const params = useLocalSearchParams();
    const [assignedMember, setAssignedMember] = useState<string | null>(null);
    const [tasks, setTasks] = useState<{id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean, parent_task_id: number}[]>([]);
    
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
        }, []);

    useFocusEffect(
      React.useCallback(() => {
        const fetchProjectTasks = async () => {
          try {
            const response = await fetch(`http://${ipAddr}:5000/getProjectTasks?projectID=${params.project_id}`);
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
      
      const toggleCheckbox = () => {
        setChecked(!checked);
        task.completed = !checked;

        const rootTaskId = (task.parent_task_id === null) ? task.id : tasks.find(t => t.id === task.parent_task_id)?.id;
        if (rootTaskId !== undefined) {
          tasks.forEach((t) => {
            let currentParentId: number | null = t.parent_task_id;
            while (currentParentId !== null) {
              if (currentParentId === rootTaskId) {
          t.completed = task.completed;
          break;
              }
              currentParentId = tasks.find(x => x.id === currentParentId)?.parent_task_id || null;
            }
            if (t.id === rootTaskId) {
              t.completed = task.completed;
            }
          });
        }
      };
      
      return (
        <TouchableOpacity onPress={() => router.push({ pathname: '/inApp/taskScreen', params: {team_name: params.team_name,project_id: params.project_id, team_id: params.team_id, task_id: task.id, task_name: task.name, task_description: task.description, task_assigned_to: task.assigned_to, task_deadline: task.deadline ? task.deadline.toString() : '', task_completed: task.completed ? task.completed.toString() : '' }})}
        style={styles.taskContainer}
        >
        <TouchableOpacity
          style={[styles.checkbox, checked && { backgroundColor: 'gray' }]}
          onPress={toggleCheckbox}
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
                <View style={[styles.container, {width: '100%'}]}>
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
                    <FlatList
                                style={{ width: "100%" }}
                                data={tasks.filter(task => task.parent_task_id === Number(params.task_id))}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View>
                                        <TaskItem task={item} />
                                    </View>
                                )}
                                contentContainerStyle={{ padding: 16 }}
                            />
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>Status: </Text>
                        <Text style={[styles.statusText, styles.notCompleted]}>Not completed</Text>
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
