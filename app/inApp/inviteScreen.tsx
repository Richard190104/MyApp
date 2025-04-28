import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';

export default function InviteScreen() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [invites, setInvites] = useState<
        { invite_id: number; team_name: string; sender_name: string }[]
    >([]);
    const [user, setUser] = useState<number | null>(null);
    const [teams, setTeams] = useState<
        { team_id: number; team_name: string}[]>([]);

    useEffect(() => {
        const fetchInvites = async () => {
            const userId = await getUserId();
            if (!userId) return;

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.warn("No auth token found");
                return;
            }
    
            try {
                const response = await fetch(`http://${ipAddr}:5000/getInvitations?userId=${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
    
                if (Array.isArray(data)) {
                    setInvites(data);
                } else {
                    console.warn("Unexpected response:", data);
                    setInvites([]);
                }
            } catch (error) {
                console.error("Failed to fetch invitations", error);
                setInvites([]);
            }
        };
    
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
                setTeams(data.map((team: { id: number; name: string }) => ({
                    team_id: team.id,
                    team_name: team.name,
                })));

                }
            } catch (error) {
                console.error("Error fetching team names:", error);
            }
            } else {
            console.warn("User ID or token was null");
            }
        };

        fetchUserAndTeams();

        fetchInvites();
    }, []);

    const handleAccept = async (inviteId: number) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.warn("No auth token found");
                return;
            }

            const response = await fetch(`http://${ipAddr}:5000/acceptInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setInvites(prev => prev.filter(invite => invite.invite_id !== inviteId));
            } else {
                alert(data.error || 'Failed to accept invitation.');
            }
        } catch (error) {
            console.error('Error accepting invite:', error);
        }
    };
    
    const handleDecline = async (inviteId: number) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.warn("No auth token found");
                return;
            }

            const response = await fetch(`http://${ipAddr}:5000/declineInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setInvites(prev => prev.filter(invite => invite.invite_id !== inviteId));
            } else {
                alert(data.error || 'Failed to decline invitation.');
            }
        } catch (error) {
            console.error('Error declining invite:', error);
        }
    };
 
    return (
        <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background }]}>
            <TopBar />
            <Text style={[styles.Header, { color: theme.text }]}>Invitations</Text>

            <View style={styles.inviteList}>
                {invites.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: theme.text }}>No invitations available.</Text>
                ) : (
                    invites.map(invite => (
                        <View key={invite.invite_id} style={[styles.inviteItem, { backgroundColor: theme.card }]}>
                            <Text style={[styles.inviteText, { color: theme.text }]}>
                                {invite.sender_name} invited you to join{' '}
                                <Text style={{ fontWeight: 'bold', color: theme.primary }}>{invite.team_name}</Text>
                            </Text>
                            <View style={styles.inviteButtons}>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.success }]}
                                    onPress={() => handleAccept(invite.invite_id)}
                                >
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.danger }]}
                                    onPress={() => handleDecline(invite.invite_id)}
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <Text style={[styles.Header, { color: theme.text }]}>Chats</Text>

            <View style={{ width: '100%', flex: 1, alignItems: 'center', marginTop: 20 }}>
                <FlatList
                    data={teams}
                    style={{ width: '100%' }}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                    keyExtractor={(item) => item.team_id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.chatScreen, { backgroundColor: theme.card }]}
                            onPress={() =>
                                router.push({
                                    pathname: '/inApp/chatScreen',
                                    params: { team_id: item.team_id, user_id: user },
                                })
                            }
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                                {item.team_name} Chat
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <BottomBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    MainContainer: {
        padding: 10,
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    Header: {
        fontSize: 22,
        marginTop: 20,
        fontWeight: 'bold',
    },
    inviteList: {
        width: '90%',
        marginTop: 20,
        marginBottom: 20,
    },
    inviteItem: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    inviteText: {
        fontSize: 16,
        marginBottom: 10,
    },
    inviteButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    button: {
        padding: 8,
        borderRadius: 8,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
    },
    chatScreen: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    chatList: {
        width: '80%',
    }, 
});
