"use client";

import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as api from "../services/api";
import SegmentedControl from "@react-native-segmented-control/segmented-control";

const MyBooksScreen = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getUserBooks();

      console.log("MyBooks API response (borrowed):", response);

      if (response.success) {
        console.log("Books loaded:", response.books);
        setBooks(response.books || []);
      } else {
        setError(response.message || "Failed to load your borrowed books");
        Alert.alert("Error", response.message || "Failed to load your borrowed books");
      }
    } catch (error) {
      console.error("Error loading user books:", error);
      setError("Failed to load your borrowed books. Please try again.");
      Alert.alert("Error", "Failed to load your borrowed books. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const handleBookPress = (book) => {
    if (!book || !book._id) {
      console.error("Cannot navigate: Invalid book object", book);
      Alert.alert("Error", "Cannot view this book. Invalid book data.");
      return;
    }

    navigation.navigate("Books", {
      screen: "Book Detail",
      params: { bookId: book._id },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderBorrowedBookItem = ({ item }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => handleBookPress(item)}
        disabled={!item._id}
      >
        <View style={styles.bookContent}>
          <Text style={styles.bookTitle}>{item.title || "Untitled Book"}</Text>
          <Text style={styles.bookAuthor}>
            by {item.author || "Unknown Author"}
          </Text>
          <View style={styles.bookMeta}>
            <Text style={styles.borrowDate}>
              Borrowed: {formatDate(item.borrowedAt)}
            </Text>
            {item.returnedAt ? (
              <Text style={[styles.returnStatus, styles.returned]}>
                Returned: {formatDate(item.returnedAt)}
              </Text>
            ) : (
              <Text style={[styles.returnStatus, styles.active]}>Active</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <SegmentedControl
          values={["Borrowed Books"]}
          selectedIndex={0}
          style={styles.segmentControl}
        />

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadBooks}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={renderBorrowedBookItem}
            keyExtractor={(item) => {
              if (item._id) return item._id;
              if (item.borrowId) return item.borrowId;
              return `${item.title || "untitled"}-${item.author || "unknown"}`;
            }}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  You haven't borrowed any books yet
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate("Books")}
                >
                  <Text style={styles.browseButtonText}>Browse Books</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  segmentContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  segmentControl: {
    marginBottom: 16,
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
    flexGrow: 1,
  },
  bookItem: {
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
  bookMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  borrowDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    marginRight: 8,
  },
  returnStatus: {
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  active: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
  returned: {
    backgroundColor: "#e8f5e9",
    color: "#388e3c",
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
});

export default MyBooksScreen;