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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import * as api from "../services/api"

const MyBorrowsScreen = () => {
  const [borrows, setBorrows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [returning, setReturning] = useState(null)

  const navigation = useNavigation()

  useEffect(() => {
    loadMyBorrows()
  }, [])

  const loadMyBorrows = async () => {
    try {
      setLoading(true)
      const response = await api.getUserBorrows()
      if (response.success) {
        // Filter to only show active borrows
        const activeBorrows = response.borrows.filter((borrow) => !borrow.returnedAt)
        setBorrows(activeBorrows)
      } else {
        Alert.alert("Error", response.message || "Failed to load your borrows")
      }
    } catch (error) {
      console.error("Error loading user borrows:", error)
      Alert.alert("Error", "Failed to load your borrows. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadMyBorrows()
  }

  const handleBookPress = (book) => {
    navigation.navigate("Books", {
      screen: "Book Detail",
      params: { bookId: book._id },
    })
  }

  const handleReturnBook = async (borrowId) => {
    try {
      setReturning(borrowId)
      const response = await api.returnBook(borrowId)
      if (response.success) {
        Alert.alert("Success", "Book returned successfully")
        // Refresh the list
        loadMyBorrows()
      } else {
        Alert.alert("Error", response.message || "Failed to return book")
      }
    } catch (error) {
      console.error("Error returning book:", error)
      Alert.alert("Error", "Failed to return book. Please try again.")
    } finally {
      setReturning(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const renderBorrowItem = ({ item }) => (
    <View style={styles.borrowItem}>
      <TouchableOpacity style={styles.bookContent} onPress={() => handleBookPress(item.book)}>
        <Text style={styles.bookTitle}>{item.book.title}</Text>
        <Text style={styles.bookAuthor}>by {item.book.author}</Text>
        <Text style={styles.borrowDate}>Borrowed: {formatDate(item.borrowedAt)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => handleReturnBook(item._id)}
        disabled={returning === item._id}
      >
        {returning === item._id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.returnButtonText}>Return</Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
        </View>
      ) : (
        <FlatList
          data={borrows}
          renderItem={renderBorrowItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>You don't have any active borrows</Text>
              <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate("Books")}>
                <Text style={styles.browseButtonText}>Browse Books</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

// Styles remain the same
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  borrowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  bookContent: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  bookAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  borrowDate: {
    fontSize: 12,
    color: "#666",
  },
  returnButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  returnButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default MyBorrowsScreen
