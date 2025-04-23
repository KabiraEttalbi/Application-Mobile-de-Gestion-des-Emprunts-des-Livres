"use client"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"

import LoginScreen from "./screens/LoginScreen"
import BooksScreen from "./screens/BooksScreen"
import BookDetailScreen from "./screens/BookDetailScreen"
import MyBooksScreen from "./screens/MyBooksScreen"
import MyBorrowsScreen from "./screens/MyBorrowsScreen"
import ProfileScreen from "./screens/ProfileScreen"
import AdminScreen from "./screens/AdminScreen"
import AddBookScreen from "./screens/AddBookScreen"
import { AuthProvider, useAuth } from "./context/AuthContext"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const MainTabs = () => {
  const { isAdmin } = useAuth()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Books") {
            iconName = focused ? "book" : "book-outline"
          } else if (route.name === "My Books") {
            iconName = focused ? "library" : "library-outline"
          } else if (route.name === "My Borrows") {
            iconName = focused ? "time" : "time-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else if (route.name === "Admin") {
            iconName = focused ? "settings" : "settings-outline"
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: "#4a6da7",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Books" component={BooksStack} options={{ headerShown: false }} />
      <Tab.Screen name="My Books" component={MyBooksScreen} />
      <Tab.Screen name="My Borrows" component={MyBorrowsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} />}
    </Tab.Navigator>
  )
}

const BooksStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="All Books" component={BooksScreen} />
      <Stack.Screen name="Book Detail" component={BookDetailScreen} />
      <Stack.Screen name="Add Book" component={AddBookScreen} />
    </Stack.Navigator>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  )
}

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return null 
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  )
}

export default App
