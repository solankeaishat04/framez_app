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
import { SearchProvider } from '@/context/SearchContext'; // Add SearchProvider import
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inTabsGroup = segments[0] === '(tabs)';
    // If your onboarding route is actually 'home', update accordingly; otherwise, remove or correct this check.
    const isOnboarding = segments[0] === 'home';

    if (state.isAuthenticated) {
      // If authenticated and on auth pages or onboarding, redirect to home
      if (inAuthGroup || isOnboarding) {
        router.replace('/(tabs)/home');
      }
    } else {
      // If not authenticated and not on auth pages, redirect to signin
      if (!inAuthGroup && !isOnboarding) {
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
        <SearchProvider> {/* Wrap with SearchProvider */}
          <RootLayoutNav />
        </SearchProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}