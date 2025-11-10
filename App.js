import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import PathSelectionScreen from './src/screens/PathSelectionScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import SimulationScreen from './src/screens/SimulationScreen';
import ResultScreen from './src/screens/ResultScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Doppler Simulator' }}
        />
        <Stack.Screen 
          name="PathSelection" 
          component={PathSelectionScreen}
          options={{ title: 'Select Path Type' }}
        />
        <Stack.Screen 
          name="Parameters" 
          component={ParametersScreen}
          options={{ title: 'Set Parameters' }}
        />
        <Stack.Screen 
          name="Simulation" 
          component={SimulationScreen}
          options={{ title: 'Processing Simulation' }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={({ navigation }) => ({
            title: 'Simulation Result',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={{ marginRight: 14 }}
                accessibilityLabel="New Simulation"
              >
                {/* Larger icon as requested */}
                <Text style={{ fontSize: 28 }}>🔄</Text>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
