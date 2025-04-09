import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TopBar() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.iconLeft}><Ionicons name="menu" size={40} color="gray"/></TouchableOpacity>
                <MaterialCommunityIcons name="calendar-clock" size={50} color="black" style={styles.iconCenter}/>
                <TouchableOpacity style={styles.iconRight} onPress={() => {router.back()}}><Ionicons name="arrow-back" size={40} color="black"/></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 90,
        paddingHorizontal: 10,
        width: '100%',
    },
    iconLeft: {
        flex: 1,
        width: '33%'
    },
    iconCenter: {

        flex: 1,
        textAlign: 'center',
        width: '33%'

    },
    iconRight: {
        flex: 1,
        width:"33%",
        alignItems: 'flex-end',
    }
});
