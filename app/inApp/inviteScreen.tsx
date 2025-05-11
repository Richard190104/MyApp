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
import InviteScreenTablet from '../tabletViews/TabletChatScreen';
import { Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export default function InviteScreen() {
    const router = useRouter();
    const isTablet = Dimensions.get('window').width >= 768;
    const { theme, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [invites, setInvites] = useState<
        { invite_id: number; team_name: string; sender_name: string }[]
    >([]);
    const [user, setUser] = useState<number | null>(null);
    const [teams, setTeams] = useState<
        { team_id: number; team_name: string}[]>([]);


    useEffect(() => {
  crashlytics().log('Opened Chats screen');
}, []);


    useEffect(() => {
       

        const fetchInvites = async () => {
             const state = await NetInfo.fetch();
            if (!state.isConnected) {
            console.log("Offline – skipping invitation fetch");
            return;
            }
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
                if (error instanceof Error) {
                crashlytics().recordError(error);
                    } else {
                        crashlytics().recordError(new Error(String(error)));
                    }
                console.error("Failed to fetch invitations", error);
                setInvites([]);
            }
        };
    

        const fetchUserAndTeams = async () => {
        const id = await getUserId();
        const token = await AsyncStorage.getItem('authToken');

        if (id !== null && token !== null) {
            setUser(id);
            const teamsKey = `teams_${id}`;
            const netState = await NetInfo.fetch();

            if (netState.isConnected) {
            try {
                const response = await fetch(`http://${ipAddr}:5000/getTeams?userID=${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                const teams = data.map((team: { id: number; name: string }) => ({
                    team_id: team.id,
                    team_name: team.name,
                }));
                setTeams(teams);
                await AsyncStorage.setItem(teamsKey, JSON.stringify(teams));
                }
            } catch (error) {
                if (error instanceof Error) {
                crashlytics().recordError(error);
            } else {
                crashlytics().recordError(new Error(String(error)));
            }
                console.error("Error fetching team names:", error);
            }
            } else {
            console.warn("No internet connection. Loading teams from cache.");
            try {
                const cached = await AsyncStorage.getItem(teamsKey);
                if (cached) {
                    console.log(cached)
                const teams = JSON.parse(cached);
                  const mapped = teams.map((team: any) => ({
                    team_id: team.id,
                    team_name: team.name,
                }));
                setTeams(mapped);
                } else {
                console.warn("No cached teams found.");
                }
            } catch (error) {
                if (error instanceof Error) {
                crashlytics().recordError(error);
                } else {
                    crashlytics().recordError(new Error(String(error)));
                }
                console.error("Error loading teams from cache:", error);
            }
            }
        } else {
            console.warn("User ID or token was null");
        }
        };


        fetchUserAndTeams();

        fetchInvites();
    }, []);

    const handleAccept = async (inviteId: number) => {
        crashlytics().log('Attempting to accept request');

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
            if (error instanceof Error) {
                crashlytics().recordError(error);
            } else {
                crashlytics().recordError(new Error(String(error)));
            }
            console.error('Error accepting invite:', error);
        }
    };
    
    const handleDecline = async (inviteId: number) => {
        crashlytics().log('Attempting to decline request');
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
              if (error instanceof Error) {
                crashlytics().recordError(error);
            } else {
                crashlytics().recordError(new Error(String(error)));
            }
            console.error('Error declining invite:', error);
        }
    };
    
    if(isTablet){
        return <InviteScreenTablet />;
    }
       return (
    <SafeAreaView
        style={[styles.MainContainer, { backgroundColor: theme.background }]}
        accessible={true}
        accessibilityLabel="Invitations and chat screen"
        accessibilityHint="View invitations and open team chats"
        accessibilityLanguage="en-US"
    >
        <TopBar />

        <Text
        style={[styles.Header, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel="Invitations"
        accessibilityLanguage="en-US"
        >
        Invitations
        </Text>

        <View
        style={styles.inviteList}
        accessibilityLabel="Invitation list"
        accessibilityRole="list"
        accessibilityLanguage="en-US"
        >
        {invites.length === 0 ? (
            <Text
            style={{ textAlign: 'center', marginTop: 20, color: theme.text }}
            accessibilityLabel="No invitations available"
            >
            No invitations available.
            </Text>
        ) : (
            invites.map((invite) => (
            <View
                key={invite.invite_id}
                style={[styles.inviteItem, { backgroundColor: theme.card }]}
                accessible={true}
                accessibilityLabel={`Invitation from ${invite.sender_name} to join team ${invite.team_name}`}
                accessibilityLanguage="en-US"
            >
                <Text style={[styles.inviteText, { color: theme.text }]}>
                {invite.sender_name} invited you to join{' '}
                <Text style={{ fontWeight: 'bold', color: theme.primary }}>{invite.team_name}</Text>
                </Text>

                <View style={styles.inviteButtons}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.success }]}
                    onPress={() => handleAccept(invite.invite_id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept invitation to ${invite.team_name}`}
                    accessibilityLanguage="en-US"
                >
                    <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.danger }]}
                    onPress={() => handleDecline(invite.invite_id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decline invitation to ${invite.team_name}`}
                    accessibilityLanguage="en-US"
                >
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                </View>
            </View>
            ))
        )}
        </View>

        <Text
        style={[styles.Header, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel="Chats"
        accessibilityLanguage="en-US"
        >
        Chats
        </Text>

        <View
        style={{ width: '100%', flex: 1, alignItems: 'center', marginTop: 20 }}
        accessibilityLabel="Chat list"
        accessibilityRole="list"
        accessibilityLanguage="en-US"
        >
        <FlatList
            data={teams}
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            keyExtractor={(item) => String(item?.team_id ?? Math.random().toString())}
            renderItem={({ item }) => (
            <TouchableOpacity
                style={[styles.chatScreen, { backgroundColor: theme.card }]}
                onPress={() =>
                router.push({
                    pathname: '/inApp/chatScreen',
                    params: { team_id: item.team_id, user_id: user },
                })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open chat with team ${item.team_name}`}
                accessibilityLanguage="en-US"
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