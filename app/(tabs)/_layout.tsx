import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}>
        <Tabs.Screen  
          name='home'
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name='search'
          options={{
            title: 'Search',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={size} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name='post'
          options={{
            title: 'Post',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'add-circle' : 'add-circle-outline'} 
                size={size} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={color} 
              />
            )
          }}
        />
      </Tabs>
    </ProtectedRoute>
  )
}