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

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState<number | null>(null);
    const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);

    useEffect(() => {

        const fetchUserAndTeams = async () => {
            const id = await getUserId();
            const token = await AsyncStorage.getItem('authToken');

            if (id !== null && token !== null) {
            setUser(id);
            try {
                const response = await fetch(`http://${ipAddr}:5000/getTeams?userID=${id}`, {
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

        fetchUserAndTeams();
    }, []);

    return (
        <SafeAreaView style={styles.MainContainer}>
            <TopBar />
            
            <View style={styles.headerRow}>
            <Text style={styles.SmolText}>Teams</Text>
            <TouchableOpacity
                onPress={() => router.push('/inApp/createTeamScreen')}
                style={styles.addButton}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.teamList, { paddingBottom: 80 }]}>
            {teams.length > 0 ? (
                teams.map(team => (
                <TouchableOpacity
                    key={team.id}
                    style={styles.teamButton}
                    onPress={() => router.push({ pathname: './team', params: { team_id: team.id.toString(), team_name: team.name, team_creator_id: team.creator_id, user:user?.toString() } })}
                >
                    <Text style={styles.teamButtonText}>{team.name}</Text>
                </TouchableOpacity>
                ))
            ) : (
                <Text style={styles.noTeamsText}>You are not a member of any team yet.</Text>
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
        backgroundColor: "#f9f9f9",
    },
    SmolText: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
        fontWeight: "800",
        color: "#333",
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
        backgroundColor: "#70ABAF",
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
        color: "#222",
        textAlign: "center",
        marginBottom: 10,
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
    teamList: {
        width: "100%",
        paddingHorizontal: 30,
        marginTop: 10,

    },
});
