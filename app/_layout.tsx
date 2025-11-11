/* eslint-disable @typescript-eslint/no-unused-vars */
// app/_layout.tsx
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts
} from '@expo-google-fonts/manrope';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SearchProvider } from '@/context/SearchContext';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnboarding = String(segments[0]) === '(onboarding)';

    // For authenticated users
    if (state.isAuthenticated) {
      // If on auth pages, redirect to home
      if (inAuthGroup) {
        router.replace('/(tabs)/home');
      }
      // If on onboarding, allow them to continue to home via buttons
      // No redirect needed as onboarding handles navigation
    } else {
      // For unauthenticated users
      // If not on auth pages and not on onboarding, redirect to signin
      // Use segments.length to detect the root/index route instead of comparing to 'index'
      if (!inAuthGroup && !isOnboarding && segments.length > 0) {
        router.replace('/(auth)/signin');
      }
    }
  }, [state.isAuthenticated, segments, state.isLoading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ManropeExtraLight: Manrope_200ExtraLight,
    ManropeLight: Manrope_300Light,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
    ManropeExtraBold: Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <SearchProvider>
          <RootLayoutNav />
        </SearchProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}