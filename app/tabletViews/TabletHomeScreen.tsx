import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import TeamScreen from '../inApp/team'; // ← importuješ komponent z existujúceho súboru
import TopBar from "@/components/topBar";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '@/components/bottomBar';
const TabletTeamView = () => {
    const router = useRouter();
  const { theme } = useTheme();
  const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<{ id: number; name: string; creator_id: number } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('userId');
      if (!token || !user) return;
      setUserId(parseInt(user, 10));

      try {
        const res = await fetch(`http://${ipAddr}:5000/getTeams?userID=${user}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeams(data);
          if (data.length > 0) setSelectedTeam(data[0]); 
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    };

    fetchTeams();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <TopBar/>
    <View style={[styles.container, { backgroundColor: theme.background, marginBottom: 80 }]}>

      <View style={[styles.sidebar, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>Your Teams</Text>
        <TouchableOpacity
            onPress={() => router.push('/inApp/createTeamScreen')}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            >
            <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <ScrollView>
          {teams.map((team: any) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamItem,
                {
                  backgroundColor:
                    selectedTeam?.id === team.id ? theme.primary : theme.background,
                },
              ]}
              onPress={() => setSelectedTeam(team)}
            >
              <Text
                style={[
                  styles.teamName,
                  {
                    color:
                      selectedTeam?.id === team.id
                        ? theme.background
                        : theme.text,
                  },
                ]}
              >
                {team.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.detailPanel}>
        {selectedTeam ? (
          <TeamScreen
            team_id={selectedTeam.id.toString()}
            team_name={selectedTeam.name}
            team_creator_id={selectedTeam.creator_id.toString()}
            user={userId?.toString()}
          />
        ) : (
          <Text style={[styles.placeholderText, { color: theme.text }]}>
            Select a team to view details
          </Text>
        )}
      </View>
    </View>
    <BottomBar/>
    </SafeAreaView>
  );
};

export default TabletTeamView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.3,
    padding: 20,
  },
  detailPanel: {
    width: Dimensions.get('window').width * 0.7,
    borderLeftWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  teamItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  addButton: {
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
},
});
