import { View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import ButtonMain from '@/components/button';
import {ipAddr} from "@/components/backendip"; 
import { useTheme } from '@/components/ThemeContext';
import { Dimensions } from 'react-native';
import TabletRegister from '../tabletViews/TabletRegister';
const isTablet = Dimensions.get('window').width >= 768;
export default function RegisterScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [email, setEmail] = React.useState('');
    const [username, setName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [Rpassword, setRPassword] = React.useState('');

    async function register() {
        if (email && password && password === Rpassword) {
            try {
                const response = await fetch(`http://${ipAddr}:5000/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password, username }),
                });

                if (response.ok) {
                    console.log('Registration successful');
                    alert('Registration successful');
                    router.push('/auth/login');
                } else {
                    console.error('Registration failed');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else if(!email && !password) {
            alert('Please fill in all required fields');
        } else{
            alert('Passwords do not match');
        }
    }
    if (isTablet) {
        return <TabletRegister email={email} username={username} password={password} repeatPassword={Rpassword} onEmailChange={setEmail} onUsernameChange={setName} onPasswordChange={setPassword} onRepeatPasswordChange={setRPassword} onRegister={register} onNavigateLogin={() => router.replace("/auth/login")} theme={theme} />;
    }
    return (
        <View style={[styles.MainContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.MainText, {color: theme.text}]}>Register</Text>
            <TextInput 
                style={[styles.Input, { color: theme.text }]} 
                placeholder="Name..." 
                placeholderTextColor={theme.text} 
                onChangeText={(text) => setName(text)}
            />
            <TextInput 
                style={[styles.Input, { color: theme.text }]} 
                placeholder="Email..." 
                placeholderTextColor={theme.text} 
                onChangeText={(text) => setEmail(text)}
            />
            <TextInput 
                style={[styles.Input, { color: theme.text }]} 
                placeholder="Password..." 
                placeholderTextColor={theme.text} 
                onChangeText={(text) => setPassword(text)} 
                secureTextEntry
            />
            <TextInput 
                style={[styles.Input, { color: theme.text }]} 
                placeholder="Password..." 
                placeholderTextColor={theme.text} 
                onChangeText={(text) => setRPassword(text)} 
                secureTextEntry
            />
            <ButtonMain title="Register" onPress={register} styling={1}></ButtonMain>
            <Button title="Login" onPress={() => router.replace("/auth/login") } /> 
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
    MainText:{
      fontSize: 50,
      fontWeight: "bold",
    },
    Input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius:  5,
        width: '80%',
        padding: 10,
        marginTop: 20,
        fontSize: 15,
    },
  });