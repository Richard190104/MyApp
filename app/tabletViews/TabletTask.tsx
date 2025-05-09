import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';

const TabletTaskScreen = ({
  task,
  subtasks,
  assignedMember,
  onAssignPress,
  onToggleTask,
  onSubtaskPress,
  onCreateSubtask,
  showAssignmentModal,
  members,
  onAssignTo,
  onCloseModal,
  userRole,
  userId,
  taskAssignedTo
}: any) => {
  const { theme } = useTheme();
  const isAdmin = userRole === 'admin' || userRole === 'owner' || userId === taskAssignedTo;
  const TaskItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => onSubtaskPress(item)}
      style={[styles.taskContainer, { backgroundColor: theme.card }]}
    >
      <TouchableOpacity
        style={[styles.checkbox, item.completed && { backgroundColor: theme.card }]}
        onPress={() => onToggleTask(item.id, !item.completed, item.name)}
      >
        {item.completed && <Ionicons name="checkmark" size={16} color="white" />}
      </TouchableOpacity>
      <Text style={[styles.taskText, { color: theme.text }]}>{item.name}</Text>
      {item.assigned_to === userId && (
        <Ionicons name="person-outline" size={24} color={theme.text} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.leftPanel, { backgroundColor: theme.background }]}>        
        <Text style={[styles.title, { color: theme.text }]}>{task.name}</Text>
        <View style={styles.assignContainer}>
          <MaterialIcons name="account-circle" size={30} color={theme.text} />
          <Text style={[styles.assignedText, { color: theme.text }]}>Assigned to: {assignedMember}</Text>

          {isAdmin && (
            <TouchableOpacity onPress={onAssignPress} style={{ marginLeft: 10 }}>
              <FontAwesome name="pencil" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subsubHeader, { color: theme.text }]}>Deadline:</Text>
        <Text style={[styles.description, { color: theme.text }]}>{task.deadline}</Text>

        <Text style={[styles.subHeader, { color: theme.text }]}>Description</Text>
        <Text style={[styles.description, { color: theme.text }]}>{task.description}</Text>

        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[styles.checkbox, task.completed && { backgroundColor: theme.primary }]}
            onPress={() => onToggleTask(task.id, !task.completed, task.name)}
          >
            {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
          </TouchableOpacity>
          <Text style={[styles.statusText, { color: theme.text }]}>        
            {task.completed ? 'Task is completed' : 'Task is not completed'}
          </Text>
        </View>
      </View>

      <View style={[styles.rightPanel, { backgroundColor: theme.background }]}>        
        <View style={styles.subtaskHeader}>          
          <Text style={[styles.subHeader, { color: theme.text }]}>Subtasks</Text>
          {isAdmin && (
            <TouchableOpacity onPress={onCreateSubtask} style={[styles.addButton, { backgroundColor: theme.primary }]}>              
              <Ionicons name="add" size={15} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={subtasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={TaskItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ color: theme.text, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
              No subtasks for this task
            </Text>
          }
        />

      </View>

      {showAssignmentModal && (
        <Modal
          transparent
          visible
          animationType="slide"
          onRequestClose={onCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>              
              <Text style={[styles.modalTitle, { color: theme.text }]}>Assign task to a team member</Text>
              <FlatList
                data={members}
                keyExtractor={(item) => item.user_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => onAssignTo(task.id, item.user_id)}
                    style={[styles.optionButton, { backgroundColor: theme.primary }]}
                  >
                    <Text style={{ color: 'white' }}>{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={onCloseModal}>
                <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  leftPanel: {
    flex: 1,
    padding: 20,
  },
  rightPanel: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  assignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignedText: {
    fontSize: 16,
    marginLeft: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subsubHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
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
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    padding: 6,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    minWidth: '80%',
    alignItems: 'center',
  },
  cancelText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default TabletTaskScreen;