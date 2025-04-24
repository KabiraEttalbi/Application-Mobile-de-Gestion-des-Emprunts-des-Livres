"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as api from "../services/api"
import { useAuth } from "../context/AuthContext"

const AdminScreen = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getUsers()

      if (response.success) {
        console.log(`Loaded ${response.users.length} users`)
        setUsers(response.users || [])
      } else {
        setError(response.message || "Failed to load users")
        Alert.alert("Error", response.message || "Failed to load users")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Failed to load users. Please try again.")
      Alert.alert("Error", "Failed to load users. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadUsers()
  }

  const handleUserPress = (user) => {
    if (!user || !user._id) {
      console.error("Cannot select user: Invalid user object", user)
      return
    }

    setSelectedUser(user)
    setModalVisible(true)
  }

  const handleChangeRole = async (userId, newRole) => {
    if (!userId) {
      Alert.alert("Error", "Cannot update role: User ID is missing")
      return
    }

    try {
      setActionLoading(true)
      const response = await api.updateUserRole(userId, newRole)

      if (response.success) {
        Alert.alert("Success", `User role updated to ${newRole}`)
        setModalVisible(false)
        loadUsers()
      } else {
        Alert.alert("Error", response.message || "Failed to update user role")
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      Alert.alert("Error", "Failed to update user role. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      Alert.alert("Error", "Cannot delete user: User ID is missing")
      return
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this user? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading(true)
            const response = await api.deleteUser(userId)

            if (response.success) {
              Alert.alert("Success", "User deleted successfully")
              setModalVisible(false)
              loadUsers()
            } else {
              Alert.alert("Error", response.message || "Failed to delete user")
            }
          } catch (error) {
            console.error("Error deleting user:", error)
            Alert.alert("Error", "Failed to delete user. Please try again.")
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }

  const renderUserItem = ({ item }) => {
    if (!item) return null

    const isCurrentUser = currentUser && item._id === currentUser._id

    return (
      <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item)} disabled={isCurrentUser}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{(item.name || "U").charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || "Unknown User"}</Text>
          <Text style={styles.userEmail}>{item.email || "No email"}</Text>
          <View style={styles.userRole}>
            <Text style={[styles.userRoleText, item.role === "admin" ? styles.adminRole : styles.userRoleText]}>
              {item.role === "admin" ? "Administrator" : "User"}
            </Text>
          </View>
        </View>
        {!isCurrentUser && <Ionicons name="chevron-forward" size={24} color="#999" />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id || `user-${Math.random().toString(36).substring(2, 9)}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Management</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>Name</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.name || "Unknown"}</Text>
                </View>

                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>Email</Text>
                  <Text style={styles.userDetailValue}>{selectedUser.email || "No email"}</Text>
                </View>

                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>Role</Text>
                  <Text style={[styles.userDetailValue, selectedUser.role === "admin" ? styles.adminRole : {}]}>
                    {selectedUser.role === "admin" ? "Administrator" : "User"}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  {selectedUser.role === "admin" ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.makeUserButton]}
                      onPress={() => handleChangeRole(selectedUser._id, "user")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="person-outline" size={18} color="#fff" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>Make User</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.makeAdminButton]}
                      onPress={() => handleChangeRole(selectedUser._id, "admin")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="shield-outline" size={18} color="#fff" style={styles.buttonIcon} />
                          <Text style={styles.actionButtonText}>Make Admin</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(selectedUser._id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.actionButtonText}>Delete User</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4a6da7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userRole: {
    flexDirection: "row",
    alignItems: "center",
  },
  userRoleText: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  adminRole: {
    color: "#4a6da7",
    backgroundColor: "#e3f2fd",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 16,
  },
  userDetailItem: {
    marginBottom: 16,
  },
  userDetailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userDetailValue: {
    fontSize: 16,
    color: "#333",
  },
  actionButtons: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  makeAdminButton: {
    backgroundColor: "#4a6da7",
  },
  makeUserButton: {
    backgroundColor: "#ff9800",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default AdminScreen
