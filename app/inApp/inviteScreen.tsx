import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import { Ionicons } from '@expo/vector-icons';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';

export default function InviteScreen() {
    const [invites, setInvites] = useState<
        { invite_id: number; team_name: string; sender_name: string }[]
    >([]);

    useEffect(() => {
        const fetchInvites = async () => {
            const userId = await getUserId();
            if (!userId) return;
    
            try {
                const response = await fetch(`http://${ipAddr}:5000/getInvitations?userId=${userId}`);
                const data = await response.json();
                console.log("Fetched invites:", data);
    
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
    
        fetchInvites();
    }, []);

    const handleAccept = async (inviteId: number) => {
        try {
            const response = await fetch(`http://${ipAddr}:5000/acceptInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });
    
            const data = await response.json();
            console.log('Accepted response:', data);
    
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
            const response = await fetch(`http://${ipAddr}:5000/declineInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invite_id: inviteId }),
            });
    
            const data = await response.json();
            console.log('Declined response:', data);
    
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
        <SafeAreaView style={styles.MainContainer}>
            <TopBar />
            <Text style={styles.Header}>Invitations</Text>

            <View style={styles.inviteList}>
                {invites.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>No invitations available.</Text>
                ) : (
                    invites.map(invite => (
                        <View key={invite.invite_id} style={styles.inviteItem}>
                            <Text style={styles.inviteText}>
                                {invite.sender_name} invited you to join{' '}
                                <Text style={{ fontWeight: 'bold' }}>{invite.team_name}</Text>
                            </Text>
                            <View style={styles.inviteButtons}>
                                <TouchableOpacity
                                    style={[styles.button, styles.acceptButton]}
                                    onPress={() => handleAccept(invite.invite_id)}
                                >
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.declineButton]}
                                    onPress={() => handleDecline(invite.invite_id)}
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
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
        backgroundColor: '#fff',
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
        backgroundColor: '#f2f2f2',
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
});
