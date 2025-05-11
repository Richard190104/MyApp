import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  AccessibilityProps
} from "react-native";
import { useTheme } from "@/components/ThemeContext";

// ✅ Rozšírenie typu ButtonStyle o AccessibilityProps
type ButtonStyle = {
  title: string;
  onPress: () => void;
  styling?: number;
  disabled?: boolean;
} & AccessibilityProps;

const ButtonMain = (props: ButtonStyle) => {
  const { theme } = useTheme();

  const {
    title,
    onPress,
    styling,
    disabled,
    ...accessibilityProps // ✅ odchytenie zvyšných props
  } = props;

  return (
    <View style={styles.container} accessible={false}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.buttonStyle,
          styling === 1 ? styles.primaryButton : styles.secondaryButton,
          { backgroundColor: theme.primary },
        ]}
        {...accessibilityProps} // ✅ prenesenie všetkých accessibility props
      >
        <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
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
  buttonStyle: {
    padding: 10,
    borderRadius: 5,
    width: "80%",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
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
