import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../services/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import POSScreen from '../screens/POSScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return null; // You can add a splash screen here if needed
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#2D3436' },
          animationEnabled: true,
          gestureEnabled: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Only Login Screen
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              animationTypeForReplace: 'pop',
            }}
          />
        ) : (
          // Main App Stack - POS and History
          <>
            <Stack.Screen 
              name="POS" 
              component={POSScreen}
              options={{
                title: 'Deliver Point POS',
              }}
            />
            <Stack.Screen 
              name="History" 
              component={TransactionHistoryScreen}
              options={{
                title: 'Transaction History',
                animationTypeForReplace: 'push',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;