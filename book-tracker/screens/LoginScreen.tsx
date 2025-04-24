"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { useAuth } from "../context/AuthContext"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, register, error, clearError } = useAuth()

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error)
      clearError()
    }
  }, [error, clearError])

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    try {
      setIsSubmitting(true)

      if (isLogin) {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
    } catch (err) {
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    clearError()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#4a6da7",
    borderRadius: 5,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: "#4a6da7",
    fontSize: 14,
  },
})

export default LoginScreen
