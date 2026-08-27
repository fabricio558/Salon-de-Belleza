import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function Header({ navigation, titulo = "Mandala", subtitulo = "Tu Centro de Belleza de Confianza" }) {
  return (
    <View style={styles.header}>
      <Pressable 
        style={styles.hamburgerButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>{subtitulo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  }
});