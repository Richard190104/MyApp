import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, FlatList, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ipAddr } from "@/components/backendip";
import { useFocusEffect } from '@react-navigation/native';
import React from "react";
import { useTheme } from '@/components/ThemeContext';
import TabletProjectScreen from "../tabletViews/TabletProjectScreen";

const TeamScreen = () => {
    const params = useLocalSearchParams();
    const [tasks, setTasks] = useState<{id: number; name: string; description: string; assigned_to: number; deadline: Date; completed: boolean, parent_task_id: number}[]>([]);
    const [progress, setProgress] = useState(0);
    const { theme } = useTheme();
    const isTablet = Dimensions.get('window').width > 768;
    function calculate_percentage(tasks: { completed: boolean }[]) {
        let completed = 0;
        tasks.forEach((task) => {
            if (task.completed) completed++;
        });
        return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
    }

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

    useFocusEffect(
        React.useCallback(() => {
            fetchProjectTasks();
        }, [params.project_id])
    );

    const modifyTaskStatus = async (task: any) => {
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

                if (response.status === 403) return alert('You don\'t have permission for that.');
                if (response.status === 401) return alert('We couldn\'t authenticate you.');
                if (!response.ok) return alert('Failed to modify task status on the server.');

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
                const updated = tasks.map(t => {
                    if (t.id === task.id || t.parent_task_id === task.id) {
                        return { ...t, completed: !task.completed };
                    }
                    return t;
                });
                setTasks(updated);
                setProgress(calculate_percentage(updated));
            }
        } catch (error) {
            console.error('Error modifying task status:', error);
        }
    };

    const TaskItem = ({ task }: { task: any }) => {
        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/inApp/taskScreen', params: {
                        team_name: params.team_name,
                        project_id: params.project_id,
                        team_id: params.team_id,
                        task_id: task.id.toString(),
                        task_name: task.name.toString(),
                        task_description: task.description,
                        task_assigned_to: task.assigned_to,
                        task_deadline: task.deadline ? task.deadline.toString() : '',
                        task_completed: task.completed ? task.completed.toString() : '',
                    }
                })}
                style={[styles.taskContainer, { backgroundColor: theme.card }]}
            >
                <TouchableOpacity
                    style={[styles.checkbox, { borderColor: theme.text }, task.completed && { backgroundColor: theme.primary }]}
                    onPress={() => modifyTaskStatus(task)}
                >
                    {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
                </TouchableOpacity>
                <Text style={[styles.taskText, { color: theme.text }]}>{task.name}</Text>
                {task.assigned_to === Number(params.user_id) && (
                    <Ionicons name="person-outline" size={24} color={theme.text} />
                )}
            </TouchableOpacity>
        );
    };

    if (isTablet) {
        return (
            <TabletProjectScreen
                teamName={Array.isArray(params.team_name) ? params.team_name[0] : params.team_name}
                projectName={params.project_name?.toString() || ''}
                tasks={tasks}
                progress={progress}
                userId={Number(params.user_id)}
                onModifyTaskStatus={modifyTaskStatus}
            />
        );
    }

    return (
        <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background }]}>
            <TopBar />
            <Text style={[styles.mainText, { color: theme.text }]}>{Array.isArray(params.team_name) ? params.team_name[0] : params.team_name}</Text>
            <View style={[styles.MainContainer, { marginBottom: 60 }]}>
                <View style={styles.headerRow}>
                    <FontAwesome name="tasks" size={32} color={theme.text} style={{ maxWidth: '30%' }} />
                    <Text style={[styles.SmolText, { paddingLeft: 10, color: theme.text }]}>{params.project_name}</Text>
                    <View style={{ maxWidth: '70%', width: '70%' }}>
                        <View style={styles.container}>
                            <View style={[styles.progressBackground, { backgroundColor: theme.card }]}>
                                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                            </View>
                            <Text style={[styles.text, { color: theme.text }]}>{progress}%</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/inApp/createTaskScreen', params: { project_id: params.project_id, team_id: params.team_id } })}
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
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
                                        <TaskItem task={subtask} />
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
    // styles remain unchanged
    MainContainer: {
        padding: 10,
        flex: 1,
        width: "100%",
        alignItems: "center",
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
        marginBottom: 10,
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
    mainText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#222",
        textAlign: "center",
        marginBottom: 10,
    },
    container: {
        alignItems: 'center',
        margin: 20,
    },
    progressBackground: {
        width: 200,
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    taskText: {
        flex: 1,
        fontSize: 16,
    },
});

export default TeamScreen;
