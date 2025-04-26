import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Topbar from '@/components/topBar';
import { getUser } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import BottomBar from '@/components/bottomBar';
import { useRouter } from 'expo-router';


export default function ProfileScreen() {
  const router = useRouter();
    const [user, setUser] = React.useState<{id: number; username: string; email:string; profile_picture: string | null }>({ id: 0, username: '', email: '', profile_picture: null });
    const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);
    const [showCodeEnterView, setShowCodeEnterView] = useState(false);
    const [code, setCode] = useState('');
    const [showResetPasswordView, setShowResetPasswordView] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    async function fetchUser() {
        const data = await getUser();
        if (data) {
            setUser(data);
        } 
    }

    const fetchUserAndTeams = async () => {
      const token = await AsyncStorage.getItem('authToken');

      if (user.id !== null && token !== null) {
        try {
            const response = await fetch(`http://${ipAddr}:5000/getTeams?userID=${user.id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
            setTeams(data);
            }
        } catch (error) {
            console.error("Error fetching team names:", error);
        }
      } else {
      console.warn("User ID or token was null");
      }
  };

      useEffect(() => {
        async function loadUserAndTeams() {
            await fetchUser(); 
        }

        loadUserAndTeams();
    }, []);

    useEffect(() => {
        if (user.id) { 
            fetchUserAndTeams();
        }
    }, [user.id]);

    async function handleChangePassword(email: string) {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const response = await fetch(`http://${ipAddr}:5000/requestPasswordReset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error(`Failed to change password: ${response.statusText}`);
        }


    }

    async function handleChangeProfilePicture() {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                alert('Camera access is required to update your profile picture.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
                base64: true,
            });

            if (!result || !result.assets || result.assets.length === 0) {
                return;
            }

            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`http://${ipAddr}:5000/updateProfilePicture`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, profilePicture: result.assets[0].base64 }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update profile picture: ${response.statusText}`);
            }

            const updatedUser = await response.json();
            if (updatedUser.profile_picture) {
                await AsyncStorage.setItem('userProfilePicture', updatedUser.profile_picture);
            } else {
                console.warn('Profile picture is null or undefined, skipping AsyncStorage update.');
            }
            setUser((prevUser) => ({
                ...prevUser,
                profile_picture: result.assets[0].base64 || null,
            }));
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error updating profile picture:', error);
        }
    }

    async function resetPassword(email: string,code: string, new_password: string, ) {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.error('No auth token found');
                return;
            }

            const response = await fetch(`http://${ipAddr}:5000/resetPassword`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: email, code: code,new_password: new_password  }),
            });

            if (!response.ok) {
                throw new Error(`Failed to reset password: ${response.statusText}`);
            }

            alert('Password reset successfully!');
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('An error occurred while resetting the password.');
        }
    }



    async function removeFromTeam(team_id: number, user_id: number, teamName: string) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch(`http://${ipAddr}:5000/removeTeamMember`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ team_id, user_id }),
        });

        if (!response.ok) {
          throw new Error(`Failed to remove user from team: ${response.statusText}`);
        }

        const updatedTeams = teams.filter(team => team.id !== team_id);
        setTeams(updatedTeams);
        alert('User removed from team successfully!');
      } catch (error) {
        console.error('Error removing user from team:', error);
        alert(`Remove team: ${teamName} failed`);

      }
    }

    useEffect(() => {}, [user.profile_picture]);

    async function VerifyPasswordReset(code: string) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch(`http://${ipAddr}:5000/verifyResetCode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: user.email, code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(`Verification failed: ${errorData.error}`);
          return;
        }

        const data = await response.json();
        alert(data.message);
        setShowCodeEnterView(false);
        setShowResetPasswordView(true);
        console.log(showResetPasswordView)
      } catch (error) {
        console.error('Error verifying reset code:', error);
        alert('An error occurred while verifying the code.');
      }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Topbar />
            <Text style={{ fontSize: 20 }}>Profile picture</Text>
            <TouchableOpacity onPress={handleChangeProfilePicture}>
                {!user.profile_picture ? (
                    <MaterialIcons name="circle" size={80} color="gray" style={styles.icon} />
                ) : (
                    <Image
                        source={{ uri: `data:image/jpeg;base64,${user.profile_picture}` }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                )}
            </TouchableOpacity>

      <View style={styles.profile}>
        <MaterialIcons name="account-circle" size={40} color="black" />
        <View style={{ marginLeft: 10 }}>
            <Text style={styles.name}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
        </View>
        
      </View>
      {user.email && (
        <View style={{ width: '90%', marginTop: 20 }}>
          <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setShowCodeEnterView(true)
          handleChangePassword(user.email);
        }}
          >
        <Text style={styles.name}>Change password</Text>
          </TouchableOpacity>
          {showCodeEnterView && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Enter Code</Text>
          <TextInput
            style={{
          borderWidth: 1,
          borderColor: 'gray',
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
            }}
            placeholder="Enter the code"
            value={code}
            onChangeText={setCode}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => VerifyPasswordReset(code)}
          >
            <Text style={styles.name}>Verify</Text>
          </TouchableOpacity>
        </View>
          )}
          {showResetPasswordView && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Reset Password</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              borderRadius: 5,
              padding: 10,
              marginBottom: 10,
            }}
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              resetPassword(user.email, code, newPassword);
              setShowResetPasswordView(false);
            }}
          >
            <Text style={styles.name}>Change Password</Text>
          </TouchableOpacity>
        </View>
          )}
        </View>
      )}
      
      <Text style={styles.sectionTitle}>My Teams</Text>
           <ScrollView contentContainerStyle={[styles.teamList, { paddingBottom: 80 }]}>
            {teams.length > 0 ? (
                teams.map(team => (
                  <View style={styles.teamButton} key={team.id}>  
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '../inApp/team', params: { team_id: team.id.toString(), team_name: team.name, team_creator_id: team.creator_id, user:user?.toString() } })}
                        >
                        <Text style={styles.teamButtonText}>{team.name}</Text>
                    </TouchableOpacity>   
                    <MaterialIcons
                      name="remove-circle"
                      size={24}
                      color="gray"
                      style={{ marginLeft: 10 }}
                      onPress={() => {
                        removeFromTeam(team.id, user.id, team.name); 
                      }}
                  />
                  
                </View>
                
                
                ))
            ) : (
                <Text style={styles.noTeamsText}>You are not a member of any team yet.</Text>
            )}
            </ScrollView>
      <BottomBar/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  icon: {
    marginBottom: 20,
  },
  profile: {
    marginBottom: 30,
    width: '90%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  teamList: {
    minWidth: '100%',
    paddingHorizontal: 20,
  },
  teamBox: {
    backgroundColor: '#ddd',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  teamText: {
    fontSize: 16,
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  button: {
    backgroundColor: 'lightgray',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }

});


