import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  TouchableOpacity,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import ButtonMain from '@/components/button';
import { getUserId, storeUser, storeUserId, getUser } from '@/components/getUser';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { Dimensions } from 'react-native';
import TabletLogin from '../tabletViews/TabletLogin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import NetInfo from '@react-native-community/netinfo';
const isTablet = Dimensions.get('window').width >= 768;

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [forgotVisible, setForgotVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  async function registerDeviceToken(token: string, authToken: string) {
    try {
      const res = await fetch(`http://${ipAddr}:5000/register_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
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

  async function requestUserPermission() {
    const authStatus = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (authStatus === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
        return true;
      }
      else{
        console.log('Notification permission denied');
        return false;
      }
    }

    useEffect(() => {
      const checkAuth = async () => {
        const state = await NetInfo.fetch();
        if(state.isConnected){
          const userobj = await getUser();
          setEmail(userobj?.email || '');
          setPassword(userobj?.password || '');
         
        }
        else{
          const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsLoading(true);

          const userId = await getUserId();
          if (userId) {
            router.replace('/inApp/homeScreen');
          }
          setIsLoading(false);

        }
        }
        
      };
    
      checkAuth();
    }, []);
    
  async function Login() {
    setIsLoading(true);
    console.log("tokenik")
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
          password: password

        };
        await storeUserId(data.userID, data.token);
        await storeUser(userInfo);
        router.replace('/inApp/homeScreen');
        await analytics().logEvent('login', {
             name: data.username
          });
        const permissionGranted = await requestUserPermission();
        if (permissionGranted) {
        const fcmToken = await messaging().getToken();
        
        if (fcmToken) {
          await registerDeviceToken(fcmToken, data.token);
           await analytics().logEvent('token_registered', {
             name: data.username
          });
        }

        } else {
          console.warn('Push notification permission not granted');

        }
      } else {
        Alert.alert('Invalid email or password');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Could not log in');
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetFlow = async () => {
    setIsLoading(true);
    try {
      if (step === 1) {
        await fetch(`http://${ipAddr}:5000/requestPasswordReset`, {
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
          Alert.alert('Invalid or expired code');
        }
      } else if (step === 3) {
        if (newPassword1 !== newPassword2) {
          Alert.alert('Passwords do not match');
          return;
        }
        const res = await fetch(`http://${ipAddr}:5000/resetPassword`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resetEmail,
            code: resetCode,
            new_password: newPassword1,
          }),
        });
        if (res.ok) {
          Alert.alert('Password changed successfully');
          setForgotVisible(false);
          setStep(1);
          setResetEmail('');
          setResetCode('');
          setNewPassword1('');
          setNewPassword2('');
        } else {
          Alert.alert('Failed to change password');
        }
      }
    } catch {
      Alert.alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  if (isTablet) {
    return (
      <TabletLogin
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onLogin={Login}
        isLoading={isLoading}
        theme={theme}
        onNavigateRegister={() => router.replace('/auth/register')}
        onOpenForgot={() => setForgotVisible(true)}
        forgotVisible={forgotVisible}
        setForgotVisible={setForgotVisible}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetCode={resetCode}
        setResetCode={setResetCode}
        newPassword1={newPassword1}
        setNewPassword1={setNewPassword1}
        newPassword2={newPassword2}
        setNewPassword2={setNewPassword2}
        step={step}
        handleResetFlow={handleResetFlow}
      />
    );
  }
    return (
    <View
      style={[styles.MainContainer, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityLabel="Login screen"
      accessibilityHint="Enter email and password to log in"
    >
      <Text
        style={[styles.MainText, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel="Log in"
        accessibilityLanguage="en-US"
      >
        Log In
      </Text>

      <TextInput
        style={[styles.Input, { borderColor: theme.text, color: theme.text }]}
        placeholder="Email..."
        placeholderTextColor={theme.text}
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email input"
        accessibilityRole="text"
        keyboardType="email-address"
        accessibilityLanguage="en-US"
      />

      <TextInput
        style={[styles.Input, { borderColor: theme.text, color: theme.text }]}
        placeholder="Password..."
        placeholderTextColor={theme.text}
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Password input"
        accessibilityRole="text"
        secureTextEntry={true}
        accessibilityLanguage="en-US"
      />

      <ButtonMain
        title="Log In"
        onPress={Login}
        styling={1}
        disabled={isLoading}
        accessibilityLabel="Log in button"
        accessibilityHint="Press to log into your account"
        accessibilityRole="button"
        accessibilityLanguage="en-US"
      />

      <Button
        title="Register"
        onPress={() => router.replace("/auth/register")}
        accessibilityLabel="Register button"
      />

      <TouchableOpacity
        onPress={() => setForgotVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
        accessibilityHint="Opens password reset modal"
        accessibilityLanguage="en-US"
      >
        <Text style={{ color: 'blue', marginTop: 10 }}>Forgot password?</Text>
      </TouchableOpacity>

      <Modal visible={forgotVisible} transparent animationType="slide" accessibilityViewIsModal={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {step === 1 && (
              <>
                <Text
                  style={styles.modalTitle}
                  accessibilityRole="header"
                  accessibilityLabel="Enter your email"
                  accessibilityLanguage="en-US"
                >
                  Enter your email:
                </Text>
                <TextInput
                  placeholder="Email"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  style={styles.modalInput}
                  placeholderTextColor="gray"
                  accessibilityLabel="Email input for password reset"
                  keyboardType="email-address"
                  accessibilityLanguage="en-US"
                />
              </>
            )}
            {step === 2 && (
              <>
                <Text
                  style={styles.modalTitle}
                  accessibilityRole="header"
                  accessibilityLabel="Enter the code you received via email"
                  accessibilityLanguage="en-US"
                >
                  Enter the code you received via email:
                </Text>
                <TextInput
                  placeholder="6-digit code"
                  value={resetCode}
                  onChangeText={setResetCode}
                  style={styles.modalInput}
                  placeholderTextColor="gray"
                  accessibilityLabel="Verification code input"
                  keyboardType="numeric"
                  accessibilityLanguage="en-US"
                />
              </>
            )}
            {step === 3 && (
              <>
                <Text
                  style={styles.modalTitle}
                  accessibilityRole="header"
                  accessibilityLabel="Enter your new password"
                  accessibilityLanguage="en-US"
                >
                  Enter your new password:
                </Text>
                <TextInput
                  placeholder="New password"
                  secureTextEntry
                  value={newPassword1}
                  onChangeText={setNewPassword1}
                  style={styles.modalInput}
                  placeholderTextColor="gray"
                  accessibilityLabel="New password input"
                  accessibilityLanguage="en-US"
                />
                <TextInput
                  placeholder="Confirm password"
                  secureTextEntry
                  value={newPassword2}
                  onChangeText={setNewPassword2}
                  style={styles.modalInput}
                  placeholderTextColor="gray"
                  accessibilityLabel="Confirm new password input"
                  accessibilityLanguage="en-US"
                />
              </>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.okButton}
                onPress={handleResetFlow}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Confirm password reset"
                accessibilityHint="Sends password reset request"
                accessibilityLanguage="en-US"
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setForgotVisible(false);
                  setStep(1);
                }}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Cancel password reset"
                accessibilityHint="Closes the reset password modal"
                accessibilityLanguage="en-US"
              >
                <Text style={styles.buttonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  MainContainer: {
    padding: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  MainText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  Input: {
    height: 50,
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
