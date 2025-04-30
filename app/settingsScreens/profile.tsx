import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Topbar from '@/components/topBar';
import { getUser } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import BottomBar from '@/components/bottomBar';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';


export default function ProfileScreen() {
  const router = useRouter();
    const { theme } = useTheme();
  
    const [user, setUser] = React.useState<{id: number; username: string; email:string; profile_picture: string | null }>({ id: 0, username: '', email: '', profile_picture: null });
    const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);

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


    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Topbar />

      {!user.profile_picture ? (
        <MaterialIcons name="circle" size={80} color="gray" style={styles.icon} />
      ) : (
        <Image
          source={{ uri: `data:image/jpeg;base64,${user.profile_picture}` }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
        />
      )}

      <View style={styles.profile}>
        <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={[styles.name, { color: theme.text }]}>{user.username}</Text>
          <Text style={[styles.email, { color: theme.text }]}>{user.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>My Teams</Text>

      <ScrollView contentContainerStyle={[styles.teamList, { paddingBottom: 80 }]}>
        {teams.length > 0 ? (
          teams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[styles.teamButton, { backgroundColor: theme.card }]}
              onPress={() => router.push({
                pathname: '../inApp/team',
                params: {
                  team_id: team.id.toString(),
                  team_name: team.name,
                  team_creator_id: team.creator_id,
                  user: user?.toString()
                }
              })}
            >
              <Text style={[styles.teamButtonText, { color: theme.text }]}>{team.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noTeamsText, { color: theme.text }]}>
            You are not a member of any team yet.
          </Text>
        )}
      </ScrollView>

      <BottomBar />
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
    fontSize: 28,
    fontWeight: '600',
    marginTop: 5,
  },
  email: {
    fontSize: 20,
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

});


