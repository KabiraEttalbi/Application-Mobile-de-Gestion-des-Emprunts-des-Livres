"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import * as api from "../services/api"
import { useAuth } from "../context/AuthContext"

const BookDetailScreen = () => {
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [borrowing, setBorrowing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const route = useRoute()
  const navigation = useNavigation()
  const { isAdmin } = useAuth()
  const { bookId } = route.params 

  useEffect(() => {
    if (!bookId) {
      setError("Book ID is missing")
      setLoading(false)
      return
    }

    loadBookDetails()
  }, [bookId])

  const loadBookDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading book details for ID:", bookId)
      const response = await api.getBook(bookId)

      if (response.success) {
        console.log("Book details loaded:", response.book)
        setBook(response.book)
      } else {
        console.error("API error:", response.message)
        setError(response.message || "Failed to load book details")
        Alert.alert("Error", response.message || "Failed to load book details")
      }
    } catch (error) {
      console.error("Error loading book details:", error)
      setError("Failed to load book details. Please try again.")
      Alert.alert("Error", "Failed to load book details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBorrowBook = async () => {
    if (!bookId) {
      Alert.alert("Error", "Cannot borrow book: Book ID is missing")
      return
    }

    try {
      setBorrowing(true)
      const response = await api.borrowBook(bookId)

      if (response.success) {
        Alert.alert("Success", "Book borrowed successfully")
        loadBookDetails()
      } else {
        Alert.alert("Error", response.message || "Failed to borrow book")
      }
    } catch (error) {
      console.error("Error borrowing book:", error)
      Alert.alert("Error", "Failed to borrow book. Please try again.")
    } finally {
      setBorrowing(false)
    }
  }

  const handleDeleteBook = async () => {
    if (!bookId) {
      Alert.alert("Error", "Cannot delete book: Book ID is missing")
      return
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this book? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true)
            const response = await api.deleteBook(bookId)

            if (response.success) {
              Alert.alert("Success", "Book deleted successfully", [{ text: "OK", onPress: () => navigation.goBack() }])
            } else {
              Alert.alert("Error", response.message || "Failed to delete book")
              setDeleting(false)
            }
          } catch (error) {
            console.error("Error deleting book:", error)
            Alert.alert("Error", "Failed to delete book. Please try again.")
            setDeleting(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    )
  }

  if (error || !book) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error || "Book not found"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{book.title || "Untitled Book"}</Text>
          <Text style={styles.author}>by {book.author || "Unknown Author"}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusBadge, book.available ? styles.availableBadge : styles.borrowedBadge]}>
            {book.available ? "Available" : "Borrowed"}
          </Text>
        </View>

        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {book.genre && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <Text style={styles.genre}>{book.genre}</Text>
          </View>
        )}

        {book.publishedYear && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Published Year</Text>
            <Text style={styles.publishedYear}>{book.publishedYear}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {book.available && (
            <TouchableOpacity style={styles.borrowButton} onPress={handleBorrowBook} disabled={borrowing}>
              {borrowing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="book" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Borrow Book</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isAdmin && (
            <View style={styles.adminActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("Add Book", { book })}>
                <Ionicons name="create" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteBook} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: "#666",
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "bold",
  },
  availableBadge: {
    backgroundColor: "#e6f7ee",
    color: "#2e7d32",
  },
  borrowedBadge: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  genre: {
    fontSize: 16,
    color: "#333",
  },
  publishedYear: {
    fontSize: 16,
    color: "#333",
  },
  actionsContainer: {
    marginTop: 20,
  },
  borrowButton: {
    backgroundColor: "#4a6da7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  adminActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: "#4caf50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default BookDetailScreen
