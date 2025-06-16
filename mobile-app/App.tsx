import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';

import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { SyncProvider } from './src/contexts/SyncContext';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoadPlanningScreen from './src/screens/LoadPlanningScreen';
import QuizScreen from './src/screens/QuizScreen';
import ScenariosScreen from './src/screens/ScenariosScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider>
        <AuthProvider>
          <SyncProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#1f2937',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen} 
                  options={{ title: 'LOADMworkflow' }}
                />
                <Stack.Screen 
                  name="LoadPlanning" 
                  component={LoadPlanningScreen} 
                  options={{ title: 'Load Planning' }}
                />
                <Stack.Screen 
                  name="Quiz" 
                  component={QuizScreen} 
                  options={{ title: 'Quiz' }}
                />
                <Stack.Screen 
                  name="Scenarios" 
                  component={ScenariosScreen} 
                  options={{ title: 'Scenarios' }}
                />
                <Stack.Screen 
                  name="Documents" 
                  component={DocumentsScreen} 
                  options={{ title: 'Documents' }}
                />
                <Stack.Screen 
                  name="Chat" 
                  component={ChatScreen} 
                  options={{ title: 'Chat' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
          </SyncProvider>
        </AuthProvider>
      </DatabaseProvider>
    </QueryClientProvider>
  );
}