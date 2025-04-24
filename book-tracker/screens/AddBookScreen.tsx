"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import * as api from "../services/api"

const AddBookScreen = () => {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [publishedYear, setPublishedYear] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)

  const navigation = useNavigation()
  const route = useRoute()
  const book = route.params?.book

  useEffect(() => {
    if (book) {
      console.log("Editing book:", book)
      setTitle(book.title || "")
      setAuthor(book.author || "")
      setDescription(book.description || "")
      setGenre(book.genre || "")
      setPublishedYear(book.publishedYear ? book.publishedYear.toString() : "")
      setIsEditing(true)
    }
  }, [book])

  const validateForm = () => {
    setError(null)

    if (!title.trim()) {
      setError("Title is required")
      Alert.alert("Error", "Title is required")
      return false
    }

    if (!author.trim()) {
      setError("Author is required")
      Alert.alert("Error", "Author is required")
      return false
    }

    if (publishedYear && !/^\d{4}$/.test(publishedYear)) {
      setError("Published year must be a 4-digit number")
      Alert.alert("Error", "Published year must be a 4-digit number")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      const bookData = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined,
        publishedYear: publishedYear ? Number.parseInt(publishedYear) : undefined,
      }

      let response

      if (isEditing) {
        if (!book || !book._id) {
          setError("Cannot update book: Book ID is missing")
          Alert.alert("Error", "Cannot update book: Book ID is missing")
          setLoading(false)
          return
        }

        response = await api.updateBook(book._id, bookData)
      } else {
        response = await api.addBook(bookData)
      }

      if (response.success) {
        Alert.alert("Success", isEditing ? "Book updated successfully" : "Book added successfully", [
          {
            text: "OK",
            onPress: () => {
              if (isEditing) {
                navigation.navigate("Book Detail", { bookId: book._id })
              } else {
                navigation.navigate("All Books")
              }
            },
          },
        ])
      } else {
        setError(response.message || "Failed to save book")
        Alert.alert("Error", response.message || "Failed to save book")
      }
    } catch (error) {
      console.error("Error saving book:", error)
      setError("Failed to save book. Please try again.")
      Alert.alert("Error", "Failed to save book. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isEditing ? "Edit Book" : "Add New Book"}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter book title" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Author *</Text>
          <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Enter author name" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter book description"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Genre</Text>
          <TextInput style={styles.input} value={genre} onChangeText={setGenre} placeholder="Enter book genre" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Published Year</Text>
          <TextInput
            style={styles.input}
            value={publishedYear}
            onChangeText={setPublishedYear}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditing ? "Update Book" : "Add Book"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  errorText: {
    color: "#f44336",
    marginBottom: 16,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default AddBookScreen
