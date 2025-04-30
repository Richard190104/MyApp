import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomBar from '@/components/bottomBar';
import TopBar from '@/components/topBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserId } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';

export default   function CreateProjectScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [projectName, setprojectName] = useState('');
    const [deadline, setdeadline] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [errors, setErrors] = useState<{ name: boolean; description: boolean }>({
        name: false,
        description: false,
    });
    const { theme, toggleTheme } = useTheme();
  
    const handleCreateTeam = async () => {
        const userID = await getUserId();
    
        const nameEmpty = !projectName.trim();
        const descEmpty = !deadline.trim();
    
        if (nameEmpty || descEmpty || !userID) {
            setErrors({
                name: nameEmpty,
                description: descEmpty,
            });
            return;
        }
    
        try {
            const token = await AsyncStorage.getItem('authToken');

            const response = await fetch(`http://${ipAddr}:5000/createProject`, { 
                
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: projectName,
                    deadline: deadline,
                    team_id: params.team_id,

                }),
            });
    
            const data = await response.json();
            console.log("RESPONSE:", response.status, data);
    
            if (response.ok) {
                setShowToast(true);
    
                setTimeout(() => {
                    setShowToast(false);
                    router.back();
                    router.replace({ pathname: './team', params: { team_id: params.team_id.toString(), team_name: params.team_name, team_creator_id: params.team_creator_id, user:userID?.toString() } })
                }, 2000);
            } else if (response.status === 403) {
                Alert.alert('Error', 'You don’t have permission for that.');
            } else if (response.status === 401) {
                Alert.alert('Error', 'We couldn’t authenticate you.');
            } else {
                Alert.alert('Error', data.message || 'Failed to create project.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong!');
            console.error(error);
        }
    };
    

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <TopBar />
        <Text style={[styles.title, { color: theme.text }]}>Create new Project</Text>
  
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Project name"
            placeholderTextColor={theme.text}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary },
              errors.name && styles.inputError
            ]}
            value={projectName}
            onChangeText={(text) => {
              setprojectName(text);
              if (errors.name && text.trim()) {
                setErrors((prev) => ({ ...prev, name: false }));
              }
            }}
          />
          {errors.name && <Text style={[styles.errorIcon, { color: theme.text }]}>❌</Text>}
        </View>
  
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Deadline (YYYY-MM-DD)"
            placeholderTextColor={theme.text}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary },
              errors.description && styles.inputError
            ]}
            value={deadline}
            onChangeText={(text) => {
              setdeadline(text);
              if (errors.description && text.trim()) {
                setErrors((prev) => ({ ...prev, description: false }));
              }
            }}
          />
          {errors.description && <Text style={[styles.errorIcon, { color: theme.text }]}>❌</Text>}
        </View>
  
        <TouchableOpacity style={[styles.createButton, { backgroundColor: theme.primary }]} onPress={handleCreateTeam}>
          <Text style={[styles.createButtonText, { color: theme.text }]}>Create Project</Text>
        </TouchableOpacity>
  
        {showToast && (
          <View style={[styles.toastCenter, { backgroundColor: theme.card }]}>
            <Text style={[styles.toastText, { color: theme.text }]}>New Project: {projectName} created!</Text>
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
    },
    
    addButton: {
        padding: 10,
        borderRadius: 8,
        marginLeft: 10,
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
