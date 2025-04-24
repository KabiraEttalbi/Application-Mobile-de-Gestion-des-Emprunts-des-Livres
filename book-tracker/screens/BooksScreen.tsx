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
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as api from "../services/api";
import { useAuth } from "../context/AuthContext";

const BooksScreen = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const navigation = useNavigation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        (book: any) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await api.getBooks();
      if (response.success) {
        setBooks(response.books);
        setFilteredBooks(response.books);
      } else {
        Alert.alert("Error", response.message || "Failed to load books");
      }
    } catch (error) {
      console.error("Error loading books:", error);
      Alert.alert("Error", "Failed to load books. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const handleBookPress = (book: any) => {
    navigation.navigate("Book Detail", { bookId: book._id });
  };

  const renderBookItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => handleBookPress(item)}
    >
      <View style={styles.bookContent}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>by {item.author}</Text>
        <View style={styles.bookMeta}>
          <Text
            style={[
              styles.bookStatus,
              item.available ? styles.available : styles.borrowed,
            ]}
          >
            {item.available ? "Available" : "Borrowed"}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books by title or author"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No books match your search"
                    : "No books available"}
                </Text>
              </View>
            }
          />
          {isAdmin ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("Add Book")}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  listContainer: {
    padding: 16,
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
  },
  bookStatus: {
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  available: {
    backgroundColor: "#e6f7ee",
    color: "#2e7d32",
  },
  borrowed: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#4a6da7",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default BooksScreen;
