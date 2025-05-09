import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, FlatList, StatusBar, StyleSheet, View, TextInput, Button, Text, Image } from "react-native";
import ButtonMain from "../components/button";
import { useRouter } from "expo-router";
import {getUserId, storeUser, storeUserId} from "../components/getUser"; 
import {ipAddr} from "../components/backendip"; 
import { useTheme } from '@/components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import TabletIndex from "./tabletViews/tabletindex";
import { startNetworkListener } from '@/components/queue';  
const isTablet = Dimensions.get('window').width >= 768;

const App = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { theme } = useTheme();
  

  useEffect(() => {
    startNetworkListener();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, 
    });
  }, [navigation]);
  async function Login(email: string, password: string) {
       
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
                const userInfo = {
                  id: data.userID,
                  username: data.username,
                  email: data.email,
                  profile_picture: data.profile_picture,
                };
                await storeUserId(data.userID, data.token);
                await storeUser(userInfo);
    
                router.replace("/inApp/homeScreen");
            } else {
                alert("Invalid email or password");
            }
        } catch (error) {
            alert("Could not log in");
        }
    }
    if(isTablet){
      return TabletIndex();
    }

  return (
    <View style={[styles.MainContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.MainText, { color: theme.text }]}>TaskMaster</Text>
        <View style={styles.mainLogo}>
          <MaterialIcons name="calendar-today" size={100} color={theme.text} />
        </View>
        <ButtonMain title="Log In" onPress={() => router.push('/auth/login')} styling={1}></ButtonMain>
        <ButtonMain title="Register" onPress={() => router.push('/auth/register')}></ButtonMain>
        <ButtonMain title="Skip(odstranit toto potom)" onPress={() => Login("pukacrichard1@gmail.com", "name")}></ButtonMain>
    </View>
  );
};

const styles = StyleSheet.create({
 
  MainContainer: {
    padding: 10,
    display: "flex",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  MainText:{
    fontSize: 50,
    fontWeight: "bold",
  },
  mainLogo:{
    width: '100%',
    height: 100,
    margin: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;

