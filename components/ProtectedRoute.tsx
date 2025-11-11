// components/ProtectedRoute.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.replace('/(auth)/signin');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5DB8E5" />
      </View>
    );
  }

  if (!state.isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};