// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Line, Circle, Rect } from "react-native-svg";

const Onboarding = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Always show onboarding with minimum 2 seconds loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    router.replace('/(tabs)/home');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  // Show loading indicator while preparing
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image 
          source={require('../assets/images/LOGOFRAMEZ-removebg-preview.png')} 
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#5DB8E5" style={styles.spinner} />
        <Text style={styles.loadingText}>Getting Ready...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Main Content Container */}
      <View style={styles.mainContent}>
        {/* Hanging Decorative Elements */}
        <View style={styles.hangingDecorContainer}>
          <Svg height="120" width="100%" style={styles.svgContainer}>
            {/* Left Lamp */}
            <Line x1="80" y1="0" x2="80" y2="60" stroke="#E5E7EB" strokeWidth="2" />
            <Circle cx="80" cy="70" r="12" fill="#D1D5DB" />
            <Rect x="68" y="70" width="24" height="8" fill="#E5E7EB" />
            
            {/* Center Lamp */}
            <Line x1="50%" y1="0" x2="50%" y2="80" stroke="#E5E7EB" strokeWidth="2" />
            <Circle cx="50%" cy="90" r="15" fill="#CBD5E0" />
            <Rect x="48%" y="90" width="30" height="10" fill="#E5E7EB" />
            
            {/* Right Globe */}
            <Line x1="85%" y1="0" x2="85%" y2="70" stroke="#E5E7EB" strokeWidth="2" />
            <Circle cx="85%" cy="80" r="18" fill="#5DB8E5" opacity="0.3" />
            <Circle cx="85%" cy="80" r="14" fill="#5DB8E5" opacity="0.5" />
            <Circle cx="85%" cy="80" r="10" fill="#5DB8E5" />
          </Svg>
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/LOGOFRAMEZ-removebg-preview.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/images/gif-removebg-preview.png')} 
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        
        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Welcome to Framez
          </Text>
          
          <Text style={styles.subtitle}>
            Capture Moments, Share Stories, Connect Worlds
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Bottom Blue Section */}
      <View style={styles.bottomSection} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5DB8E5",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "white",
    borderBottomLeftRadius: 80,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  hangingDecorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: -20,
    zIndex: 2,
  },
  logo: {
    width: 360, 
    height: 120, 
  },
  illustrationContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: -40, 
  },
  illustration: {
    width: 280,
    height: 320,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  bottomSection: {
    height: 50,
    backgroundColor: "#5DB8E5",
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: '#5DB8E5',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#5DB8E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingLogo: {
    width: 200,
    height: 80,
    marginBottom: 30,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#5DB8E5',
    fontWeight: '500',
  },
});

export default Onboarding;