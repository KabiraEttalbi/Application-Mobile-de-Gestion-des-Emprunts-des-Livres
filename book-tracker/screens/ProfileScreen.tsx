"use client";

import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Email cannot be empty");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        Alert.alert(
          "Error",
          "Current password is required to set a new password"
        );
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Error", "New password must be at least 6 characters long");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New passwords do not match");
        return;
      }
    }

    try {
      setLoading(true);

      const userData: {
        name: string;
        email: string;
        currentPassword?: string;
        password?: string;
      } = {
        name,
        email,
      };

      if (newPassword) {
        userData.currentPassword = currentPassword;
        userData.password = newPassword;
      }
      console.log("Updating user with id:", user?.id)
      if (user) {
        const response = await api.updateUser(user.id, userData);

        if (response.success) {
          Alert.alert("Success", "Profile updated successfully");
          setIsEditing(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          Alert.alert("Error", response.message || "Failed to update profile");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            setLoading(true);
            await logout();
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>
          {user?.role === "admin" ? "Administrator" : "User"}
        </Text>
      </View>

      <View style={styles.card}>
        {isEditing ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.passwordSection}>
              <Text style={styles.sectionTitle}>
                Change Password (Optional)
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setName(user?.name || "");
                  setEmail(user?.email || "");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {user?.role === "admin" ? "Administrator" : "User"}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#4a6da7",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4a6da7",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#e0e0e0",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  passwordSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: "#4a6da7",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: "#f44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    margin: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
