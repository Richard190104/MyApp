import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { getUserId, getUser } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import { Dimensions } from 'react-native';
import TabletCreateProjectScreen from '../tabletViews/TabletCreateProject';
import io from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import { addToQueue } from '@/components/queue';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export default function CreateProjectScreen() {
  const isTablet = Dimensions.get('window').width >= 768;
  const params = useLocalSearchParams<{
    team_id: string;
    team_name: string;
    team_creator_id: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const socket = io(`http://${ipAddr}:5000`);
  const [newMessage, setNewMessage] = useState('');
  const [projectName, setProjectName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  async function askForPermission(){
    const user = await getUser();
    if(user){
      setNewMessage('User ' + String(user.username) + ' is asking for an admin role for team ' + params.team_name);
      sendMessage();
    }

  }
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    socket.emit('send_message', {
      sender_id: 50,
      team_id: params.team_id,
      content: newMessage,
    });
  }

  useEffect(() => {
    crashlytics().log('Opened Create Project Screen');
  }, []);

  const handleCreateProject = async () => {
    crashlytics().log('Attempting to create project');

    const userID = await getUserId();
    const nameEmpty = !projectName.trim();
    const descEmpty = !deadline.trim();

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

        const response = await fetch(
          `http://${ipAddr}:5000/createProject`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: projectName,
              deadline: deadline,
              team_id: params.team_id,
            }),
          }
        );
        const data = await response.json();

        if (response.ok) {
           await analytics().logEvent('project_created', {
             name: projectName,
              deadline: deadline,
              team_id: params.team_id,
          });
          setTimeout(() => {
              if (isTablet) {
              router.replace({
                pathname: './homeScreen',
              });
              return;
              }
            router.replace({
              pathname: './team',  
              params: {
                team_id: params.team_id,
                team_name: params.team_name,
                team_creator_id: params.team_creator_id,
                user: userID.toString(),
                onProject: 1,
                project_name: projectName
              },
            });
            setIsLoading(false);

          },3000);
          
        } else if (response.status === 403) {
          Alert.alert(
            'Error',
            'You are not allowed to do that with your current role. \nAsk owner for permission',
            [
              {
                text: 'Ask for permission',
                onPress: () => askForPermission(),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ],
            { cancelable: true }
          );
          setIsLoading(false);

        } else if (response.status === 401) {
          Alert.alert('Error', 'We couldn’t authenticate you.');
          setIsLoading(false);

        } else {
          Alert.alert('Error', data.message || 'Failed to create project.');
          setIsLoading(false);

        }
      }
      else{
          const localId = `local-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
          const projectData = {
            id: localId,
            name: projectName,
            deadline: deadline,
            team_id: params.team_id,
          };
          const SyncprojectData = {
            id: localId,
            project_name: projectName,
            deadline: deadline,
            team_id: params.team_id,
          };
          
          const key = `projects_${params.team_id}`;
          const existing = await AsyncStorage.getItem(key);
          const parsed = existing ? JSON.parse(existing) : [];
          await AsyncStorage.setItem(key, JSON.stringify([...parsed, SyncprojectData]));

          addToQueue({
            url: `http://${ipAddr}:5000/createProject`,
            method: 'POST',
            body: projectData,
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
          });

          Alert.alert(
            'Offline Mode',
            'You are offline. The project will be created once connection is restored.'
          );

          router.replace({
            pathname: './team',
            params: {
              team_id: params.team_id,
              team_name: params.team_name,
              team_creator_id: params.team_creator_id,
              user: userID.toString(),
              onProject: 1,
              project_name: projectName
            },
          });

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
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Creating Project...</Text>
      </View>
    );
  }
  if (isTablet) {
    return (
      <TabletCreateProjectScreen
        projectName={projectName}
        setProjectName={setProjectName}
        deadline={deadline}
        setDeadline={setDeadline}
        errors={errors}
        handleCreateProject={handleCreateProject}
        isLoading={isLoading}
      />
    );
  }
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />
      <Text style={[styles.title, { color: theme.text }]}>Create new Project</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Project name"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.primary },
            errors.name && styles.inputError,
          ]}
          value={projectName}
          onChangeText={(text) => {
            setProjectName(text);
            if (errors.name && text.trim()) setErrors((p) => ({ ...p, name: false }));
          }}
        />
        {errors.name && <Text style={[styles.errorIcon]}>❌</Text>}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Deadline (YYYY-MM-DD)"
          placeholderTextColor={theme.text}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.primary },
            errors.description && styles.inputError,
          ]}
          value={deadline}
          onChangeText={(text) => {
            setDeadline(text);
            if (errors.description && text.trim())
              setErrors((p) => ({ ...p, description: false }));
          }}
        />
        {errors.description && <Text style={[styles.errorIcon]}>❌</Text>}
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateProject}
        disabled={isLoading}
      >
        <Text style={[styles.createButtonText, { color: theme.text }]}>
          Create Project
        </Text>
      </TouchableOpacity>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    width: '90%',
    padding: 10,
    marginBottom: 10,
  },
  inputError: { borderColor: 'red' },
  errorIcon: { marginLeft: 5, color: 'red', fontSize: 18 },
  createButton: {
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: { fontSize: 16, fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
