import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, StatusBar, StyleSheet, View, TextInput, Button, Text, Image } from "react-native";
import ButtonMain from "../components/button";
import { useRouter } from "expo-router";
import {storeUserId} from "../components/getUser"; 
import {ipAddr} from "../components/backendip"; 

const App = () => {
  const router = useRouter();

  async function Login() {
  var email = "name";
  var password = "name"
    try {
        const response = await fetch(`http://${ipAddr}:5000/login`, {
            method: 'POST',
            headers: {
          'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            console.log("Login successful");
            const data = await response.json();
            storeUserId(data.userID, data.token);
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
        <Text style={styles.MainText}>TaskMaster</Text>
        <Image source={require('../assets/images/calendar.png')} style={styles.mainLogo} />
        <ButtonMain title="Log In" onPress={() => router.push('/auth/login')} styling={1}></ButtonMain>
        <ButtonMain title="Register" onPress={() => router.push('/auth/register')}></ButtonMain>
        <ButtonMain title="Skip(odstranit toto potom)" onPress={Login}></ButtonMain>
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
    backgroundColor: "white",
  },
  MainText:{
    fontSize: 50,
    fontWeight: "bold",
  },
  mainLogo:{
    width: 150,
    height: 150,
    margin: 40,
  }
});

export default App;

