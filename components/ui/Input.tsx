import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Extend from TextInputProps to get all native TextInput props
interface InputProps extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  icon,
  showPasswordToggle = false,
  // TextInput props with defaults
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoCorrect = true,
  autoComplete,
  ...rest // Capture all other TextInput props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : styles.inputNormal
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? '#ef4444' : '#9ca3af'} 
            style={styles.icon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isPasswordVisible && secureTextEntry}
          style={styles.textInput}
          placeholderTextColor="#9ca3af"
          // TextInput props
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          // Pass through any other props
          {...rest}
        />
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  inputNormal: {
    borderColor: "#D1D5DB",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 16,
    padding: 0, // Remove default padding
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});