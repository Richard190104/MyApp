import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { useTheme } from '@/components/ThemeContext';

type ButtonStyle = {
    title: string;
    onPress: () => void;
    styling?: number;
}


const ButtonMain = (props: ButtonStyle) => {
    const { theme } = useTheme();
  
    return (
<View style={styles.container} accessible={true}>
  <TouchableOpacity
    onPress={props.onPress}
    style={[
      styles.buttonStyle,
      props.styling === 1 ? styles.primaryButton : styles.secondaryButton,
      {backgroundColor: theme.primary }
    ]}
   
    accessibilityLabel="Button on home screen"
    accessibilityHint="Sends the form"
    accessibilityRole="button"
    accessibilityState={{ disabled: false }}
  >
    <Text style={[styles.text, {color: theme.text}]}>{props.title}</Text>
  </TouchableOpacity>
</View>

    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        display: "flex",
        width: "100%",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    buttonStyle:{
        padding: 10,
        borderRadius:  5,
        width: "80%",
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    text:{
        color: "white",
        fontWeight: "bold",
        fontSize: 20,
    },
    primaryButton: {
      height: 60,
      },
    secondaryButton: {
      height: 50,
      },
});

export default ButtonMain;
