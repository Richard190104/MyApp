import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import BottomBar from '@/components/bottomBar';
import { getUserId } from '@/components/getUser';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import { Ionicons } from '@expo/vector-icons';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext'; 
import { Dimensions } from 'react-native';
import TabletHomeScreen from '../tabletViews/TabletHomeScreen';
import NetInfo from '@react-native-community/netinfo';
import { useLocalSearchParams } from 'expo-router';

const isTablet = Dimensions.get('window').width >= 768;
export default function HomeScreen() {  
    const router = useRouter();
    const { theme, toggleTheme } = useTheme(); 
    const [user, setUser] = useState<number | null>(null);
    const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);
    const localParams = useLocalSearchParams();

    useEffect(() => {
        const fetchUserAndTeams = async () => {
            try {
                const id = await getUserId();
                const token = await AsyncStorage.getItem('authToken');
        
                if (id !== null && token !== null) {
                    setUser(id); 
        
                    const state = await NetInfo.fetch();
                    if (state.isConnected) {
                        console.log("Internet is connected. Fetching teams from backend...");
                        try {
                            const response = await fetch(`http://${ipAddr}:5000/getTeams?userID=${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const data = await response.json();
                            if (Array.isArray(data)) {
                                setTeams(data);
                                await AsyncStorage.setItem(`teams_${id}`, JSON.stringify(data));
                                console.log("Teams fetched and stored locally.");
                                if (localParams?.onTeam === "1" && localParams?.team_name) {
                                    const matchedTeam = data.find(
                                      (team: { name: string }) => team.name === localParams.team_name
                                    );
                                    if (matchedTeam) {
                                      router.replace({
                                        pathname: './team',
                                        params: {
                                          team_id: matchedTeam.id.toString(),
                                          team_name: matchedTeam.name,
                                          team_creator_id: matchedTeam.creator_id,
                                          usero: id.toString()
                                        }
                                      });
                                    } else {
                                      console.warn("Team with given name not found.");
                                    }
                                  }
                            } else {
                                console.warn("Unexpected response:", data);
                            }
                        } catch (error) {
                            console.error("Error fetching teams from backend:", error);
                        }
                    } else {
                        console.log("No internet connection. Trying to load teams from cache...");
                        const cached = await AsyncStorage.getItem(`teams_${id}`);
                        if (cached) {
                            const parsed = JSON.parse(cached);
                            setTeams(parsed);
                            console.log("Teams loaded from cache.");
                        } else {
                            console.warn("No cached teams found.");
                        }
                    }
        
                } else {
                    console.warn("User ID or token was null");
                }
            } catch (error) {
                console.error("Unexpected error in fetchUserAndTeams:", error);
            }
        };
        

        fetchUserAndTeams();
    }, []);

    if (isTablet) {
        return <TabletHomeScreen />;
    }

    return (
        <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background }]}>
            <TopBar />
            
            <View style={styles.headerRow}>
                <Text style={[styles.SmolText, { color: theme.text }]}>Teams</Text>
                <TouchableOpacity
                    onPress={() => router.push('/inApp/createTeamScreen')}
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={{ backgroundColor: theme.background }}
                contentContainerStyle={[styles.teamList, { paddingBottom: 80 }]}
                >
                {teams.length > 0 ? (
                    teams.map(team => (
                    <TouchableOpacity
                        key={team.id}
                        style={[styles.teamButton, { backgroundColor: theme.card }]} 
                        onPress={() => router.push({ pathname: './team', params: { team_id: team.id.toString(), team_name: team.name, team_creator_id: team.creator_id, usero: user?.toString() } })}
                    >
                        <Text style={[styles.teamButtonText, { color: theme.text }]}>
                        {team.name}
                        </Text>
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
    MainContainer: {
        padding: 10,
        flex: 1,
        width: "100%",
    },
    SmolText: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
        fontWeight: "800",
        textAlign: "left",
    },
    headerRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 30,
        paddingBottom: 10,
    },
    addButton: {
        padding: 10,
        borderRadius: 10,
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    mainText: {
        fontSize: 36,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    teamButton: {
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
    },
    noTeamsText: {
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    teamList: {
        width: "100%",
        paddingHorizontal: 30,
        marginTop: 10,
    },
});
