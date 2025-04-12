import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { useRouter } from 'expo-router';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';

export default function CreateTeamScreen() {
    const router = useRouter();
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
        name: false,
        description: false,
    });
    const [memberEmail, setMemberEmail] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const handleCreateTeam = async () => {
        const userID = await getUserId();
    
        const nameEmpty = !teamName.trim();
        const descEmpty = !teamDescription.trim();
    
        if (nameEmpty || descEmpty || !userID) {
            setErrors({
                name: nameEmpty,
                description: descEmpty,
            });
            return;
        }
    
        try {
            const token = await AsyncStorage.getItem('authToken'); 
            if (!token) {
            Alert.alert('Error', 'Authentication token not found.');
            return;
            }

            const response = await fetch(`http://${ipAddr}:5000/createTeam`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify({
                name: teamName,
                description: teamDescription,
                user_id: userID,
                members: members,
            }),
            });
    
            const data = await response.json();
            console.log("RESPONSE:", response.status, data);
    
            if (response.ok) {
                setShowToast(true);
    
                setTimeout(() => {
                    setShowToast(false);
                    router.replace('/inApp/homeScreen');
                }, 2000);
            } else {
                Alert.alert('Error', data.message || 'Failed to create team.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong!');
            console.error(error);
        }
    };
    

    return (
        <SafeAreaView style={styles.container}>
            <TopBar />
            <Text style={styles.title}>Create new Team</Text>

            <View style={styles.inputRow}>
                <TextInput
                    placeholder="Team name"
                    style={[styles.input, errors.name && styles.inputError]}
                    value={teamName}
                    onChangeText={(text) => {
                        setTeamName(text);
                        if (errors.name && text.trim()) {
                            setErrors((prev) => ({ ...prev, name: false }));
                        }
                    }}
                />
                {errors.name && <Text style={styles.errorIcon}>❌</Text>}
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    placeholder="Team description"
                    style={[styles.input, styles.textarea, errors.description && styles.inputError]}
                    multiline={true}
                    numberOfLines={4}
                    value={teamDescription}
                    onChangeText={(text) => {
                        setTeamDescription(text);
                        if (errors.description && text.trim()) {
                            setErrors((prev) => ({ ...prev, description: false }));
                        }
                    }}
                />
                {errors.description && <Text style={styles.errorIcon}>❌</Text>}
            </View>

            <Text style={styles.subTitle}>Add members</Text>

            <View style={styles.memberInputRow}>
                <Ionicons name="person-circle-outline" size={24} color="black" />
                <TextInput
                    placeholder="enter email"
                    style={styles.memberInput}
                    value={memberEmail}
                    onChangeText={setMemberEmail}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        if (memberEmail.trim() !== '') {
                            setMembers([...members, memberEmail.trim()]);
                            setMemberEmail('');
                        }
                    }}
                >
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.membersList}>
                {members.map((email, index) => (
                    <Text key={index} style={styles.memberItem}>• {email}</Text>
                ))}
            </View>


            <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
                <Text style={styles.createButtonText}>Create Team</Text>
            </TouchableOpacity>

            {showToast && (
                <View style={styles.toastCenter}>
                    <Text style={styles.toastText}>New team: {teamName} created!</Text>
                </View>
            )}

            <BottomBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    backButton: {
        alignSelf: 'flex-end',
        marginRight: 10,
        marginTop: -30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        width: '90%',
        padding: 10,
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    inputError: {
        borderColor: 'red',
    },
    errorIcon: {
        marginLeft: 5,
        color: 'red',
        fontSize: 18,
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: '#70ABAF',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    toastCenter: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        backgroundColor: '#ddd',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    
    toastText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    subTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginTop: 20,
        marginBottom: 10,
    },
    
    memberInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginBottom: 10,

    },
    
    memberInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        marginLeft: 10,
        marginRight: 10,
    },
    
    addButton: {
        backgroundColor: '#70ABAF',
        padding: 10,
        borderRadius: 5,
        
    },
    
    membersList: {
        width: '90%',
        marginBottom: 10,
    },
    
    memberItem: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    
    
});
