import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from "react-native";

type ButtonStyle = {
    title: string;
    onPress: () => void;
    styling?: number;
}

const ButtonMain = (props: ButtonStyle) => {
    return (
<View style={styles.container} accessible={true}>
  <TouchableOpacity
    onPress={props.onPress}
    style={[
      styles.buttonStyle,
      props.styling === 1 ? styles.primaryButton : styles.secondaryButton,
    ]}
   
    accessibilityLabel="Button on home screen"
    accessibilityHint="Sends the form"
    accessibilityRole="button"
    accessibilityState={{ disabled: false }}
  >
    <Text style={styles.text}>{props.title}</Text>
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
        backgroundColor: "blue",
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
        backgroundColor: "#70ABAF",
      },
    secondaryButton: {
        backgroundColor: "#32292F",
    
      },
});

export default ButtonMain;
