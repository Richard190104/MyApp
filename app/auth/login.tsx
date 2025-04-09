import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import ButtonMain from '@/components/button';
import {storeUserId} from "../../components/getUser"; 
import {ipAddr} from "@/components/backendip"; 

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function Login() {
        try {
            const response = await fetch(`http://${ipAddr}:5000/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            if (response.ok) {
                const data = await response.json();
                
                await storeUserId(data.userID, data.token);
    
                router.replace("/inApp/homeScreen");
            } else {
                alert("Invalid email or password");
            }
        } catch (error) {
            alert("Could not log in");
        }
    }
    
      
    return (
        <View style={styles.MainContainer}>
            <Text style={styles.MainText}>Log In</Text>
            <TextInput
                style={styles.Input}
                placeholder="Email..." 
                placeholderTextColor="gray"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.Input}
                placeholder="Password..."
                placeholderTextColor="gray"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <ButtonMain title="Log In" onPress={Login} styling={1}></ButtonMain>
            <Button title="Register" onPress={() => router.replace("/auth/register")} /> 
        </View>
    );
}

const styles = StyleSheet.create({
    MainContainer: {
        padding: 10,
        display: "flex",
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        backgroundColor: "white",
    },
    MainText: {
        fontSize: 50,
        fontWeight: "bold",
    },
    Input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        width: '80%',
        padding: 10,
        marginTop: 20,
        fontSize: 15,
    },
});