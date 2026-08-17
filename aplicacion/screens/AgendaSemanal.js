import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from "react-native";

export default function StackScreens({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.hamburgerButton} 
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Mandala</Text>
          <Text style={styles.subtitle}>Tu Centro de Belleza de Confianza</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Text style={styles.saludo}>Agenda Semanal</Text>
          <Text style={styles.agenda}>(FECHA)</Text>
        </View>

        <Pressable
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Configuración</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e1cec2",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#e6d3c6',
    flexDirection: 'row', 
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
  },
  hamburgerButton: {
    padding: 8,
    marginRight: 10,
  },
  hamburgerIcon: {
    fontSize: 26,
    color: '#B8838A',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 30, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8838A',
  },
  subtitle: {
    fontSize: 13,
    color: '#8D8B94',
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  body: {
    backgroundColor: "#efb7da",
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 15,
    height: 225,
    marginBottom: 15,
    padding: 10, 
  },
  saludo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: "center",
    color: '#B8838A',
  },
  agenda: {
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1295e0",
    justifyContent: "center",
    alignItems: "center",
    height: 45,
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});