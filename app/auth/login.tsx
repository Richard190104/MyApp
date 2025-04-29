import { View, Text, StyleSheet, TextInput, Button, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import ButtonMain from '@/components/button';
import { getUserId, storeUser, storeUserId } from "../../components/getUser"; 
import { ipAddr } from "@/components/backendip";
import messaging from '@react-native-firebase/messaging';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [forgotVisible, setForgotVisible] = useState(false);
    const [step, setStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword1, setNewPassword1] = useState('');
    const [newPassword2, setNewPassword2] = useState('');

    async function registerDeviceToken(token: string, authToken: string) {
        try {
            const res = await fetch(`http://${ipAddr}:5000/register_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ token })
            });

            if (!res.ok) {
                console.warn('Token registration failed');
            } else {
                console.log('FCM token registered successfully');
            }
        } catch (error) {
            console.error('Error registering token:', error);
        }
    }

    async function Login() {
        try {
            const response = await fetch(`http://${ipAddr}:5000/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const userInfo = {
                    id: data.userID,
                    username: data.username,
                    email: data.email,
                    profile_picture: data.profile_picture,
                };
                await storeUserId(data.userID, data.token);
                await storeUser(userInfo);

                const fcmToken = await messaging().getToken();
                if (fcmToken) {
                    await registerDeviceToken(fcmToken, data.token);
                }

                router.replace("/inApp/homeScreen");
            } else {
                alert("Invalid email or password");
            }
        } catch (error) {
            alert("Could not log in");
        }
    }

    const handleResetFlow = async () => {
        try {
            if (step === 1) {
                const res = await fetch(`http://${ipAddr}:5000/requestPasswordReset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail }),
                });
                setStep(2);
            } else if (step === 2) {
                const res = await fetch(`http://${ipAddr}:5000/verifyResetCode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail, code: resetCode }),
                });
                if (res.ok) {
                    setStep(3);
                } else {
                    Alert.alert("Invalid or expired code");
                }
            } else if (step === 3) {
                if (newPassword1 !== newPassword2) {
                    Alert.alert("Passwords do not match");
                    return;
                }
                const res = await fetch(`http://${ipAddr}:5000/resetPassword`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: resetEmail,
                        code: resetCode,
                        new_password: newPassword1
                    }),
                });
                if (res.ok) {
                    Alert.alert("Password changed successfully");
                    setForgotVisible(false);
                    setStep(1);
                    setResetEmail('');
                    setResetCode('');
                    setNewPassword1('');
                    setNewPassword2('');
                } else {
                    Alert.alert("Failed to change password");
                }
            }
        } catch (e) {
            Alert.alert("Something went wrong");
        }
    };

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
            <ButtonMain title="Log In" onPress={Login} styling={1} />
            <Button title="Register" onPress={() => router.replace("/auth/register")} />
    
            <TouchableOpacity onPress={() => setForgotVisible(true)}>
                <Text style={{ color: 'blue', marginTop: 10 }}>Forgot password?</Text>
            </TouchableOpacity>
    
            <Modal visible={forgotVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {step === 1 && (
                            <>
                                <Text style={styles.modalTitle}>Enter your email:</Text>
                                <TextInput
                                    placeholder="Email"
                                    value={resetEmail}
                                    onChangeText={setResetEmail}
                                    style={styles.modalInput}
                                    placeholderTextColor="gray"
                                />
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <Text style={styles.modalTitle}>Enter the code you received via email:</Text>
                                <TextInput
                                    placeholder="6-digit code"
                                    value={resetCode}
                                    onChangeText={setResetCode}
                                    style={styles.modalInput}
                                    placeholderTextColor="gray"
                                />
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <Text style={styles.modalTitle}>Enter your new password:</Text>
                                <TextInput
                                    placeholder="New password"
                                    secureTextEntry
                                    value={newPassword1}
                                    onChangeText={setNewPassword1}
                                    style={styles.modalInput}
                                    placeholderTextColor="gray"
                                />
                                <TextInput
                                    placeholder="Confirm password"
                                    secureTextEntry
                                    value={newPassword2}
                                    onChangeText={setNewPassword2}
                                    style={styles.modalInput}
                                    placeholderTextColor="gray"
                                />
                            </>
                        )}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.okButton} onPress={handleResetFlow}>
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => {
                                setForgotVisible(false);
                                setStep(1);
                            }}>
                                <Text style={styles.buttonText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '85%',
        alignItems: 'center',
        elevation: 10,
      },
      modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        alignSelf: 'flex-start',
      },
      modalInput: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 6,
        width: '100%',
        paddingHorizontal: 12,
        marginVertical: 10,
        fontSize: 15,
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
      },
      okButton: {
        flex: 1,
        backgroundColor: '#70ABAF',
        padding: 12,
        marginRight: 5,
        borderRadius: 6,
        alignItems: 'center',
      },
      cancelButton: {
        flex: 1,
        backgroundColor: '#F44336',
        padding: 12,
        marginLeft: 5,
        borderRadius: 6,
        alignItems: 'center',
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
      },
});
