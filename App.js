// App.js
import 'react-native-gesture-handler';
import 'react-native-reanimated';  
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './src/navigation/BottomTabs';
import AddEntryScreen from './src/screens/AddEntryScreen'; // ← 중괄호 X, 정확한 경로

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#fff' },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Root" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ title: '기록 추가' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
