import 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'
import LoginScreen from './src/screens/LoginScreen'
import LoadingView from './src/components/LoadingView'

const Root = createNativeStackNavigator()

function RootNavigator() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingView />
  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Root.Screen name="App" component={AppNavigator} />
      ) : (
        <Root.Screen name="Login" component={LoginScreen} />
      )}
    </Root.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  )
}
