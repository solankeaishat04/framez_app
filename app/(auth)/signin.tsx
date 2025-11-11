// app/(auth)/signin.tsx
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const SignIn = () => {
  const router = useRouter();
  const { signin, state: { isLoading } } = useAuth(); // Changed from login to signin
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");

    try {
      await signin(email, password); // Changed from login to signin
      // Success handled in AuthContext - user will be redirected automatically
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#5DB8E5", "#4A9CCC"]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome back!</Text>
            <Text style={styles.headerSubtitle}>Log in to your Framez account</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
              showPasswordToggle={true}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.rememberContainer}>
                <View style={styles.checkbox} />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={isLoading}
              variant="gradient"
            />

            {/* Sign Up Link */}
            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupText}>Dont have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
  },
  rememberText: {
    color: "#4B5563",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#5DB8E5",
    fontWeight: "600",
    fontSize: 14,
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  signupText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signupLink: {
    color: "#5DB8E5",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default SignIn;