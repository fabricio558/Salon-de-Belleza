import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function Header({ navigation, titulo = "MANDALA", subtitulo }) {
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
        {subtitulo ? <Text style={styles.subtitle}>{subtitulo}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    zIndex: 1,
  },
  hamburgerButton: {
    padding: 5,
    marginRight: 10,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 35, 
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  }
});