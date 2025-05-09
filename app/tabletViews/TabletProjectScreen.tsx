import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';

const TabletProjectTasks = ({
  teamName,
  projectName,
  tasks,
  progress,
  userId,
  onModifyTaskStatus,
  projectID,
  teamID,
}: {
  teamName: string;
  projectName: string;
  tasks: any[];
  progress: number;
  userId: number;
  onModifyTaskStatus: (task: any) => void;
  projectID: string;
  teamID: number;
}) => {
  
  const { theme } = useTheme();
  const TaskItem = ({ task }: { task: any }) => {
    return (
      <TouchableOpacity
        style={[styles.taskContainer, { backgroundColor: theme.card }]}
        onPress={() => router.push({
            pathname: '/inApp/taskScreen',
            params: {
              team_name: teamName,
              project_id: projectID,
              team_id: teamID?.toString(),
              user_id: userId.toString(),
              task_id: task.id.toString(),
              task_name: task.name,
              task_description: task.description,
              task_assigned_to: task.assigned_to ? task.assigned_to.toString() : '--',
              task_deadline: task.deadline ? task.deadline.toString() : '',
              task_completed: task.completed.toString(),
            },
          })
          }
      >
        <TouchableOpacity
          style={[styles.checkbox, { borderColor: theme.text }, task.completed && { backgroundColor: theme.primary }]}
          onPress={() => onModifyTaskStatus(task)}
        >
          {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
        </TouchableOpacity>
        <Text style={[styles.taskText, { color: theme.text }]}>{task.name}</Text>
        {task.assigned_to === userId && (
          <Ionicons name="person-outline" size={24} color={theme.text} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <TopBar/>
    <View style={[styles.container, { backgroundColor: theme.background, marginBottom: 80 }]}>
      <View style={styles.columnLeft}>
        <Text style={[styles.title, { color: theme.text }]}>{teamName}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>{projectName}</Text>
        <View style={[styles.progressBarContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
        </View>
         
        <Text style={[styles.progressText, { color: theme.text }]}>{progress.toFixed(0)}%</Text>
      </View>

      <View style={styles.columnRight}>
      <View style={styles.headerRow}>
        
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/inApp/createTaskScreen', params: { project_id: projectID, team_id: teamID } })}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
            <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        </View>
        <FlatList
          data={tasks.filter(t => t.parent_task_id === null)}
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
    </View>
    <BottomBar/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    padding: 20,
  },
  columnLeft: {
    width: '35%',
    paddingRight: 10,
  },
  columnRight: {
    width: '65%',
    paddingLeft: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    marginTop: 4,
    fontSize: 16,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'space-between',
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
});

export default TabletProjectTasks;
//koent