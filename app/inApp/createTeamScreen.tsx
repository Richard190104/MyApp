import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
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

  const handleCreateTeam = async () => {
    const userID = await getUserId();
    const nameEmpty = !teamName.trim();
    const descEmpty = !teamDescription.trim();
    if (nameEmpty || descEmpty || !userID) {
      setErrors({ name: nameEmpty, description: descEmpty });
      return;
    }

    try {
      setIsLoading(true);
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
        setTimeout(() => {
          router.replace('/inApp/homeScreen');
          setIsLoading(false);

        }, 2000);
       
      } else {
        Alert.alert('Error', data.message || 'Failed to create team.');
        setIsLoading(false);

      }
    } catch (error) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />
      <Text style={[styles.title, { color: theme.text }]}>Create new Team</Text>

      <View style={styles.inputRow}>
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
        />
        {errors.name && <Text style={styles.errorIcon}>❌</Text>}
      </View>

      <View style={styles.inputRow}>
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
        />
        {errors.description && <Text style={styles.errorIcon}>❌</Text>}
      </View>

      <Text style={[styles.subTitle, { color: theme.text }]}>Add members</Text>
      <View style={styles.memberInputRow}>
        <Ionicons name="person-circle-outline" size={24} color={theme.text} />
        <TextInput
          placeholder="enter email"
          placeholderTextColor={theme.text}
          style={[styles.memberInput, { color: theme.text, borderColor: theme.text }]}
          value={memberEmail}
          onChangeText={setMemberEmail}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            if (memberEmail.trim()) {
              setMembers((prev) => [...prev, memberEmail.trim()]);
              setMemberEmail('');
            }
          }}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.membersList}>
        {members.map((email, ix) => (
          <Text key={ix} style={[styles.memberItem, { color: theme.text }]}>
            • {email}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateTeam}
        disabled={isLoading}
      >
        <Text style={styles.createButtonText}>Create Team</Text>
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
  createButton: { padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 20 },
  createButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 18, color: '#fff', fontWeight: 'bold' },
});
