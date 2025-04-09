import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform } from "react-native";
import { router } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function goMainPage(){
    router.push('/inApp/homeScreen');
}

function goChat(){
    router.push('/inApp/inviteScreen');
}

function goCalendar(){

}



const BottomBar = () => {
    const insets = useSafeAreaInsets(); 

    return (
        <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => router.push('/inApp/homeScreen')}>
                    <Image source={require('../assets/images/main.png')} style={styles.icon}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={goChat}>
                    <Image source={require('../assets/images/chat.png')} style={styles.icon}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}}>
                    <Image source={require('../assets/images/calendar.png')} style={styles.icon}/>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        borderRadius: 25,

    },
    container: {
        borderColor: "#32292F",
        borderWidth: 2,
        height: 80,
        justifyContent: "space-around",
        alignItems: "center",
        flexDirection: "row",
    },
    icon: { 
        width: 35,
        height: 35,
        margin: 10,
    }
});

export default BottomBar;
