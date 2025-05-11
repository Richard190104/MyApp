import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Topbar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import { getUser } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';
import NetInfo from '@react-native-community/netinfo';

type UserType = {
  id: number;
  username: string;
  email: string;
  profile_picture: string | null;
};

type TeamType = {
  id: number;
  name: string;
  creator_id: number;
};

export default function ProfileScreenTablet() {
  const { theme } = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<UserType>({
    id: 0,
    username: '',
    email: '',
    profile_picture: null,
  });

  const [teams, setTeams] = useState<TeamType[]>([]);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCodeEnterView, setShowCodeEnterView] = useState(false);
  const [showResetPasswordView, setShowResetPasswordView] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const user_id = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        try {
          const response = await fetch(`http://${ipAddr}:5000/getUserInfo?user_id=${user_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setUser(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        const data = await getUser();
          if (data) {
            setUser({ ...data, profile_picture: null });
          }

        
      }
     
    }

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`http://${ipAddr}:5000/getTeams?userID=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setTeams(data);
    })();
  }, [user.id]);

  const handleChangeProfilePicture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1, base64: true });
    if (!result?.assets?.length) return;
    const token = await AsyncStorage.getItem('authToken');
    await fetch(`http://${ipAddr}:5000/updateProfilePicture`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: user.id, profilePicture: result.assets[0].base64 }),
    });
    setUser({ ...user, profile_picture: result.assets[0].base64 || null });
  };

  const handlePasswordReset = async (email: string) => {
    const token = await AsyncStorage.getItem('authToken');
    await fetch(`http://${ipAddr}:5000/requestPasswordReset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email }),
    });
  };

  const verifyCode = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const res = await fetch(`http://${ipAddr}:5000/verifyResetCode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: user.email, code }),
    });
    if (res.ok) {
      setShowCodeEnterView(false);
      setShowResetPasswordView(true);
    }
  };

  const resetPassword = async () => {
    const token = await AsyncStorage.getItem('authToken');
    await fetch(`http://${ipAddr}:5000/resetPassword`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: user.email, code, new_password: newPassword }),
    });
    setShowResetPasswordView(false);
  };

  const removeFromTeam = async (team_id: number) => {
    const token = await AsyncStorage.getItem('authToken');
    await fetch(`http://${ipAddr}:5000/removeTeamMember`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id, user_id: user.id }),
    }
 ) .then(res => {
    if(res.ok ) {
      setTeams(prev => prev.filter(team => team.id !== team_id));

    }
    else{
      alert("you do not have permission for that")
    }
 });
    
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Topbar />
      <View style={styles.row}>
        <View style={styles.leftPane}>
          <TouchableOpacity onPress={handleChangeProfilePicture}>
            {!user.profile_picture ? (
              <MaterialIcons name="account-circle" size={100} color="gray" />
            ) : (
              <Image
                source={{ uri: `data:image/jpeg;base64,${user.profile_picture}` }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            )}
          </TouchableOpacity>
          <Text style={[styles.name, { color: theme.text }]}>{user.username}</Text>
          <Text style={[styles.email, { color: theme.text }]}>{user.email}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => {
              setShowCodeEnterView(true);
              handlePasswordReset(user.email);
            }}
          >
            <MaterialIcons name="lock-reset" size={20} color="white" />
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>

          {showCodeEnterView && (
            <>
              <TextInput
                placeholder="Enter code"
                placeholderTextColor="gray"
                value={code}
                onChangeText={setCode}
                style={[styles.input, { borderColor: theme.card, color: theme.text }]}
              />
              <TouchableOpacity style={styles.button} onPress={verifyCode}>
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </>
          )}

          {showResetPasswordView && (
            <>
              <TextInput
                placeholder="New Password"
                placeholderTextColor="gray"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, { borderColor: theme.card, color: theme.text }]}
              />
              <TouchableOpacity style={styles.button} onPress={resetPassword}>
                <MaterialIcons name="vpn-key" size={20} color="white" />
                <Text style={styles.buttonText}>Reset Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.rightPane}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Teams</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {teams.length > 0 ? (
              teams.map((team) => (
                <View key={team.id} style={[styles.teamCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.teamName, { color: theme.text }]}>{team.name}</Text>
                  <TouchableOpacity onPress={() => removeFromTeam(team.id)}>
                    <MaterialIcons name="remove-circle-outline" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.text, fontStyle: 'italic' }}>
                You are not a member of any team.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flex: 1, flexDirection: 'row', padding: 20, gap: 30 },
  leftPane: { flex: 1, alignItems: 'center' },
  rightPane: { flex: 1.5 },
  name: { fontSize: 22, fontWeight: '600', marginTop: 10 },
  email: { fontSize: 14, color: 'gray' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 15,
    backgroundColor: '#444',
    borderRadius: 8,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    width: '90%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  teamCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '500',
  },
});
