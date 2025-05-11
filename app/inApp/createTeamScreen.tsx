import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { useRouter } from 'expo-router';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import { Dimensions } from 'react-native';
import TabletCreateTeamScreen from '../tabletViews/TabletCreateTeam';
import NetInfo from '@react-native-community/netinfo';
import { addToQueue, getQueue } from '@/components/queue';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
const isTablet = Dimensions.get('window').width >= 768;

export default function CreateTeamScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [isLoading, setIsLoading] = useState(false);
const generateLocalId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 1e6).toString(36); 
  return `local-${timestamp}-${random}`;
};

useEffect(() => {
  crashlytics().log('Opened Create Team Screen');
}, []);
  const handleCreateTeam = async () => {
    crashlytics().log('Attempting to create team');

    const userID = await getUserId();
    const nameEmpty = !teamName.trim();
    const descEmpty = !teamDescription.trim();
    if (nameEmpty || descEmpty || !userID) {
      setErrors({ name: nameEmpty, description: descEmpty });
      return;
    }
   
    try {
      setIsLoading(true);
      const state = await NetInfo.fetch();
      if(state.isConnected){
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          Alert.alert('Error', 'Authentication token not found.');
          return;
        }

        const response = await fetch(`http://${ipAddr}:5000/createTeam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: teamName,
            description: teamDescription,
            user_id: userID,
            members,
          }),
        });
        const data = await response.json();
        

        if (response.ok) {
          await analytics().logEvent('project_created', {
             name: teamName,
              description: teamDescription,
              user_id: userID,
          });
          setTimeout(() => {
            router.replace({ pathname:'/inApp/homeScreen', params: { team_name: teamName, onTeam: "1" }});
            setIsLoading(false);

          }, 2000);
        
        } else {
          Alert.alert('Error', data.message || 'Failed to create team.');
          setIsLoading(false);

        }
      }
      else{
        const userID = await getUserId();
        const id =  generateLocalId()
        const newTeamData = {
          name: teamName,
          description: teamDescription,
          user_id: userID,
          members,
          id: id,
        };
          addToQueue({
            url: `http://${ipAddr}:5000/createTeam`,
            method: 'POST',
            body: {
              name: teamName,
              description: teamDescription,
              user_id: userID,
              members,
              id: id,
            },
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
          });
          const existing = await AsyncStorage.getItem(`teams_${userID}`);
          const existingTeams = existing ? JSON.parse(existing) : [];

          const updatedTeams = [...existingTeams, newTeamData];

          await AsyncStorage.setItem(`teams_${userID}`, JSON.stringify(updatedTeams));
          Alert.alert('Offline', 'You are offline. The team will be created when connection is restored.');
          router.replace({ pathname:'/inApp/homeScreen', params: { team_name: teamName, onTeam: "1" }});
          setIsLoading(false);
      }
      
    } catch (error) {
      if (error instanceof Error) {
          crashlytics().recordError(error);
        } else {
          crashlytics().recordError(new Error(String(error)));
        }
      setIsLoading(false);
      Alert.alert('Error', 'Something went wrong!');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Creating Team...</Text>
      </View>
    );
  }
  if(isTablet) {
    return <TabletCreateTeamScreen teamName={teamName} setTeamName={setTeamName} teamDescription={teamDescription} setTeamDescription={setTeamDescription} memberEmail={memberEmail} setMemberEmail={setMemberEmail} members={members} setMembers={setMembers} handleCreateTeam={handleCreateTeam} errors={errors} isLoading={isLoading}/>
  }
    return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityLabel="Create team screen"
      accessibilityHint="Fill in team name, description, and members to create a team"
    >
      <TopBar />

      <Text
        style={[styles.title, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel="Create new team"
        accessibilityLanguage="en-US"
      >
        Create new Team
      </Text>

      <View
        style={styles.inputRow}
        accessible={true}
        accessibilityLabel="Team name input"
        accessibilityHint="Enter the name of the team"
        accessibilityLanguage="en-US"
      >
        <TextInput
          placeholder="Team name"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.text },
            errors.name && styles.inputError,
          ]}
          value={teamName}
          onChangeText={(text) => {
            setTeamName(text);
            if (errors.name && text.trim()) setErrors((p) => ({ ...p, name: false }));
          }}
          accessibilityLabel="Team name"
          accessibilityRole="text"
          accessibilityLanguage="en-US"
        />
        {errors.name && (
          <Text
            style={styles.errorIcon}
            accessibilityLabel="Team name is required"
            accessibilityRole="alert"
          >
            ❌
          </Text>
        )}
      </View>

      <View
        style={styles.inputRow}
        accessible={true}
        accessibilityLabel="Team description input"
        accessibilityHint="Enter the purpose or description of the team"
        accessibilityLanguage="en-US"
      >
        <TextInput
          placeholder="Team description"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            styles.textarea,
            { color: theme.text, borderColor: theme.text },
            errors.description && styles.inputError,
          ]}
          multiline
          numberOfLines={4}
          value={teamDescription}
          onChangeText={(text) => {
            setTeamDescription(text);
            if (errors.description && text.trim())
              setErrors((p) => ({ ...p, description: false }));
          }}
          accessibilityLabel="Team description"
          accessibilityRole="text"
          accessibilityLanguage="en-US"
        />
        {errors.description && (
          <Text
            style={styles.errorIcon}
            accessibilityLabel="Team description is required"
            accessibilityRole="alert"
          >
            ❌
          </Text>
        )}
      </View>

      <Text
        style={[styles.subTitle, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel="Add members"
        accessibilityLanguage="en-US"
      >
        Add members
      </Text>

      <View
        style={styles.memberInputRow}
        accessible={true}
        accessibilityLabel="Add team member by email"
        accessibilityHint="Enter email address and press Add"
        accessibilityLanguage="en-US"
      >
        <Ionicons name="person-circle-outline" size={24} color={theme.text} />
        <TextInput
          placeholder="enter email"
          placeholderTextColor={theme.text}
          style={[styles.memberInput, { color: theme.text, borderColor: theme.text }]}
          value={memberEmail}
          onChangeText={setMemberEmail}
          accessibilityLabel="Email input for member"
          keyboardType="email-address"
          accessibilityRole="text"
          accessibilityLanguage="en-US"
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            if (memberEmail.trim()) {
              setMembers((prev) => [...prev, memberEmail.trim()]);
              setMemberEmail('');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Add member"
          accessibilityHint="Adds email to the team member list"
          accessibilityLanguage="en-US"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.membersList}
        accessibilityRole="list"
        accessibilityLabel="List of added team members"
        accessibilityLanguage="en-US"
      >
        {members.map((email, ix) => (
          <Text
            key={ix}
            style={[styles.memberItem, { color: theme.text }]}
            accessibilityRole="text"
            accessibilityLabel={`Team member email: ${email}`}
          >
            • {email}
          </Text>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateTeam}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Create team"
        accessibilityHint="Creates a new team with the provided details"
        accessibilityLanguage="en-US"
        accessibilityState={{ disabled: isLoading }}
      >
        <Text
          style={styles.createButtonText}
          accessibilityLabel="Create Team"
          accessibilityLanguage="en-US"
        >
          Create Team
        </Text>
      </TouchableOpacity>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 4, width: '90%', padding: 10, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  inputError: { borderColor: 'red' },
  errorIcon: { marginLeft: 5, color: 'red', fontSize: 18 },
  textarea: { height: 100, textAlignVertical: 'top' },
  subTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 20, marginBottom: 10 },
  memberInputRow: { flexDirection: 'row', alignItems: 'center', width: '90%', marginBottom: 10 },
  memberInput: { flex: 1, borderWidth: 1, borderRadius: 4, padding: 10, marginHorizontal: 10 },
  addButton: { padding: 10, borderRadius: 5 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  membersList: { width: '90%', marginBottom: 10 },
  memberItem: { fontSize: 16, marginBottom: 4 },
  createButton: { padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 20, marginBottom:80 },
  createButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 18, color: '#fff', fontWeight: 'bold' },
});