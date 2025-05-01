import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { QrCode, CalendarCheck, ClipboardCheck, User } from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Generate QR',
          tabBarIcon: ({ color, size }) => (
            <QrCode size={size} color={color} />
          ),
          href: user?.role === 'professor' ? '/' : null,
        }}
      />
      
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
          href: user?.role === 'professor' ? '/attendance' : null,
        }}
      />

      <Tabs.Screen
        name="student-attendance"
        options={{
          title: 'My Attendance',
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck size={size} color={color} />
          ),
          href: user?.role === 'student' ? '/student-attendance' : null,
        }}
      />

      <Tabs.Screen
        name="student-index"
        options={{
          title: 'Scan QR',
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck size={size} color={color} />
          ),
          href: user?.role === 'student' ? '/student-index' : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}