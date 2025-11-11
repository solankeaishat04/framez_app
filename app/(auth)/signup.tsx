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

const SignUp = () => {
  const router = useRouter();
  const { signup, state: { isLoading } } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");

    try {
      const name = `${firstName} ${lastName}`;
      await signup({ 
        name,
        email: email.toLowerCase().trim(), 
        password
      });
      // Success handled in AuthContext - user will be logged in automatically
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
            <Text style={styles.headerTitle}>Lets Get Started!</Text>
            <Text style={styles.headerSubtitle}>Create your Framez account and start sharing moments</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  icon="person-outline"
                />
              </View>
              <View style={styles.nameInput}>
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  icon="person-outline"
                />
              </View>
            </View>

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

<Input
  placeholder="Confirm Password"
  value={confirmPassword}
  onChangeText={setConfirmPassword}
  secureTextEntry
  icon="lock-closed-outline"
  showPasswordToggle={true} 
/>

            {/* Terms & Conditions */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[
                styles.termsCheckbox,
                agreedToTerms && styles.termsCheckboxChecked
              ]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text>{" "}
                and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading || !agreedToTerms}
              variant="gradient"
            />

            {/* Sign In Link */}
            <View style={styles.signinLinkContainer}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
                <Text style={styles.signinLink}>Sign In</Text>
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
    paddingTop: 64,
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
  nameRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  termsCheckbox: {
    width: 20,
    height: 20,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  termsCheckboxChecked: {
    backgroundColor: "#5DB8E5",
    borderColor: "#5DB8E5",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  termsText: {
    color: "#4B5563",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: "#5DB8E5",
    fontWeight: "600",
  },
  signinLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  signinText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signinLink: {
    color: "#5DB8E5",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default SignUp;