// app/index.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Line, Circle, Rect } from "react-native-svg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const Onboarding = () => {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  
  // Sound reference
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
    playWelcomeSound();
    startAnimations();
    
    return () => {
      // Clean up sound when component unmounts
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playWelcomeSound = async () => {
    try {
      // You can use a gentle chime or whoosh sound
      // For now, we'll use a system sound or you can add your own audio file
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/images/cartoon-jump-6462.mp3'), // Add your sound file
        { shouldPlay: true }
      );
      soundRef.current = sound;
      
      // Optional: Configure audio settings
      await sound.setVolumeAsync(0.7);
    } catch (error) {
      console.log('Error playing sound:', error);
      // If no sound file, we'll just continue without sound
    }
  };

  const startAnimations = () => {
    // Create swinging animation for hanging elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swingAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Main entrance animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      // Scale up
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding) {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleGetStarted = async () => {
    try {
      // Add button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      
      // Add exit animation before navigation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(tabs)/home');
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Swing animation interpolation for hanging elements
  const swingInterpolate = swingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const swingStyle = {
    transform: [{ rotate: swingInterpolate }],
  };
  
  return (
    <View style={styles.container}>
      {/* Main Content Container with Animations */}
      <Animated.View 
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          }
        ]}
      >
        {/* Hanging Decorative Elements with Swing Animation */}
        <View style={styles.hangingDecorContainer}>
          <Animated.View style={[styles.svgContainer, swingStyle]}>
            <Svg height="120" width="100%">
              {/* Left Lamp with swing */}
              <Animated.View style={swingStyle}>
                <Line x1="80" y1="0" x2="80" y2="60" stroke="#E5E7EB" strokeWidth="2" />
                <Circle cx="80" cy="70" r="12" fill="#D1D5DB" />
                <Rect x="68" y="70" width="24" height="8" fill="#E5E7EB" />
              </Animated.View>
              
              {/* Center Lamp with swing */}
              <Animated.View style={swingStyle}>
                <Line x1="50%" y1="0" x2="50%" y2="80" stroke="#E5E7EB" strokeWidth="2" />
                <Circle cx="50%" cy="90" r="15" fill="#CBD5E0" />
                <Rect x="calc(50% - 15)" y="90" width="30" height="10" fill="#E5E7EB" />
              </Animated.View>
              
              {/* Right Globe with swing */}
              <Animated.View style={swingStyle}>
                <Line x1="85%" y1="0" x2="85%" y2="70" stroke="#E5E7EB" strokeWidth="2" />
                <Circle cx="85%" cy="80" r="18" fill="#5DB8E5" opacity="0.3" />
                <Circle cx="85%" cy="80" r="14" fill="#5DB8E5" opacity="0.5" />
                <Circle cx="85%" cy="80" r="10" fill="#5DB8E5" />
              </Animated.View>
            </Svg>
          </Animated.View>
        </View>
        
        {/* Logo with Bounce Animation */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          <Image 
            source={require('../assets/images/LOGOFRAMEZ-removebg-preview.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Illustration with Gentle Float Animation */}
        <Animated.View 
          style={[
            styles.illustrationContainer,
            {
              transform: [
                { 
                  translateY: swingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }) 
                },
              ],
            }
          ]}
        >
          <Image 
            source={require('../assets/images/gif-removebg-preview.png')} 
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Text Content with Staggered Animation */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
              ],
            }
          ]}
        >
          <Text style={styles.title}>
            Welcome to Framez
          </Text>
          
          <Text style={styles.subtitle}>
            Capture Moments, Share Stories, Connect Worlds
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 20],
                  }) 
                },
              ],
            }
          ]}
        >
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
        </Animated.View>
      </Animated.View>
      
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
});

export default Onboarding;