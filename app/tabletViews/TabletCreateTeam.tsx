import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';

const TabletCreateTeamScreen = ({
  teamName,
  setTeamName,
  teamDescription,
  setTeamDescription,
  memberEmail,
  setMemberEmail,
  members,
  setMembers,
  handleCreateTeam,
  errors,
  isLoading,
}: any) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <TopBar/>
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.leftPanel}>
        <View style={styles.headerRow}>
          <Ionicons name="people-circle" size={32} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>Create a New Team</Text>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Team Name</Text>
        <TextInput
          placeholder="Enter team name"
          placeholderTextColor={theme.text}
          style={[styles.input, errors.name && styles.inputError, { color: theme.text, borderColor: theme.text }]}
          value={teamName}
          onChangeText={setTeamName}
        />

        <Text style={[styles.label, { color: theme.text }]}>Description</Text>
        <TextInput
          placeholder="Enter team description"
          placeholderTextColor={theme.text}
          style={[styles.input, styles.textarea, errors.description && styles.inputError, { color: theme.text, borderColor: theme.text }]}
          value={teamDescription}
          multiline
          onChangeText={setTeamDescription}
        />

            <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateTeam}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>Create Team</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightPanel}>
      <Text style={[styles.label, { color: theme.text }]}>Invite Member</Text>
        <View style={styles.memberRow}>
          <Ionicons name="mail-outline" size={22} color={theme.text} />
          <TextInput
            placeholder="Member email"
            placeholderTextColor={theme.text}
            style={[styles.memberInput, { color: theme.text, borderColor: theme.text }]}
            value={memberEmail}
            onChangeText={setMemberEmail}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (memberEmail.trim()) {
                setMembers((prev: string[]) => [...prev, memberEmail.trim()]);
                setMemberEmail('');
              }
            }}
          >
            <MaterialIcons name="person-add" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subTitle, { color: theme.text }]}>Invited Members</Text>
        <ScrollView style={styles.membersList}>
          {members.map((email: string, index: number) => (
            <Text key={index} style={[styles.memberItem, { color: theme.text }]}>• {email}</Text>
          ))}
        </ScrollView>


      </View>
    </View>
    <BottomBar/>
    </SafeAreaView>
  );
};

export default TabletCreateTeamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    padding: 30,
    gap: 30,
  },
  leftPanel: {
    flex: 1,
  },
  rightPanel: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  addButton: {
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  membersList: {
    flex: 1,
    marginBottom: 30,
  },
  memberItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});