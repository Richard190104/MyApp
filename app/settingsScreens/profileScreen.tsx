import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Topbar from '@/components/topBar';
import { getUser } from '@/components/getUser';
// Removed unused import
import { ipAddr } from '@/components/backendip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import BottomBar from '@/components/bottomBar';


export default function ProfileScreen() {
    const [user, setUser] = React.useState<{id: number; username: string; email:string; profile_picture: string | null }>({ id: 0, username: '', email: '', profile_picture: null });

    async function fetchUser() {
        const data = await getUser();
        if (data) {
            setUser(data);
        } 
    }

    useEffect(() => {
        fetchUser();
    }), [];


    async function handleChangeProfilePicture() {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                alert('Camera access is required to update your profile picture.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
                base64: true,
            });

            if (!result || !result.assets || result.assets.length === 0) {
                return;
            }

            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`http://${ipAddr}:5000/updateProfilePicture`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, profilePicture: result.assets[0].base64 }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update profile picture: ${response.statusText}`);
            }

            const updatedUser = await response.json();
            if (updatedUser.profile_picture) {
                await AsyncStorage.setItem('userProfilePicture', updatedUser.profile_picture);
            } else {
                console.warn('Profile picture is null or undefined, skipping AsyncStorage update.');
            }
            setUser((prevUser) => ({
                ...prevUser,
                profile_picture: result.assets[0].base64 || null,
            }));
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error updating profile picture:', error);
        }
    }

    useEffect(() => {}, [user.profile_picture]);

    return (
        <SafeAreaView style={styles.container}>
            <Topbar />
            <Text style={{ fontSize: 20 }}>Profile picture</Text>
            <TouchableOpacity onPress={handleChangeProfilePicture}>
                {!user.profile_picture ? (
                    <MaterialIcons name="circle" size={80} color="gray" style={styles.icon} />
                ) : (
                    <Image
                        source={{ uri: `data:image/jpeg;base64,${user.profile_picture}` }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                )}
            </TouchableOpacity>

      <View style={styles.profile}>
        <MaterialIcons name="account-circle" size={40} color="black" />
        <View style={{ marginLeft: 10 }}>
            <Text style={styles.name}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Teams</Text>

      <BottomBar/>
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  email: {
    fontSize: 14,
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
    width: '100%',
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
});


