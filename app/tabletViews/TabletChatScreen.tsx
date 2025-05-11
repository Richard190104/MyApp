import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import { Ionicons } from '@expo/vector-icons';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';

export default function InviteScreenTablet() {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [invites, setInvites] = useState<
        { invite_id: number; team_name: string; sender_name: string }[]
    >([]);
    const [user, setUser] = useState<number | null>(null);
    const [teams, setTeams] = useState<{ team_id: number; team_name: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const userId = await getUserId();
            const token = await AsyncStorage.getItem('authToken');
            if (!userId || !token) return;

            setUser(userId);

            try {
                const inviteRes = await fetch(`http://${ipAddr}:5000/getInvitations?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const inviteData = await inviteRes.json();
                if (Array.isArray(inviteData)) setInvites(inviteData);

                const teamRes = await fetch(`http://${ipAddr}:5000/getTeams?userID=${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const teamData = await teamRes.json();
                if (Array.isArray(teamData)) {
                    setTeams(teamData.map((team: { id: number; name: string }) => ({
                        team_id: team.id,
                        team_name: team.name,
                    })));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const handleAccept = async (inviteId: number) => {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch(`http://${ipAddr}:5000/acceptInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });

            if (res.ok) {
                setInvites(prev => prev.filter(i => i.invite_id !== inviteId));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to accept.');
            }
        } catch (e) {
            console.error("Accept error", e);
        }
    };

    const handleDecline = async (inviteId: number) => {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch(`http://${ipAddr}:5000/declineInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });

            if (res.ok) {
                setInvites(prev => prev.filter(i => i.invite_id !== inviteId));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to decline.');
            }
        } catch (e) {
            console.error("Decline error", e);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <TopBar />
            <View style={styles.contentRow}>
                {/* LEFT SIDE - INVITES */}
                <View style={[styles.section, styles.leftPane]}>
                    <Text style={[styles.header, { color: theme.text }]}>Invitations</Text>
                    {invites.length === 0 ? (
                        <Text style={{ color: theme.text, marginTop: 20 }}>No invitations available.</Text>
                    ) : (
                        <FlatList
                            data={invites}
                            keyExtractor={(item) => item.invite_id.toString()}
                            renderItem={({ item }) => (
                                <View style={[styles.inviteItem, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.inviteText, { color: theme.text }]}>
                                        {item.sender_name} invited you to join{' '}
                                        <Text style={{ fontWeight: 'bold', color: theme.primary }}>{item.team_name}</Text>
                                    </Text>
                                    <View style={styles.inviteButtons}>
                                        <TouchableOpacity
                                            style={[styles.button, { backgroundColor: theme.success }]}
                                            onPress={() => handleAccept(item.invite_id)}
                                        >
                                            <Ionicons name="checkmark" size={20} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.button, { backgroundColor: theme.danger }]}
                                            onPress={() => handleDecline(item.invite_id)}
                                        >
                                            <Ionicons name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>

                {/* RIGHT SIDE - TEAMS */}
                <View style={[styles.section, styles.rightPane]}>
                    <Text style={[styles.header, { color: theme.text }]}>Chats</Text>
                    <FlatList
                        data={teams}
                        keyExtractor={(item) => item.team_id.toString()}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.chatItem, { backgroundColor: theme.card }]}
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
            </View>
            <BottomBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentRow: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 20,
    },
    section: {
        flex: 1,
        paddingTop: 20,
    },
    leftPane: {
        flex: 1.2,
    },
    rightPane: {
        flex: 1,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
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
    chatItem: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
});
