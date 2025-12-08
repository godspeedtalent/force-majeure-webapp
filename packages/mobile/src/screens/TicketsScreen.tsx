import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TicketsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets</Text>
      <Text style={styles.subtitle}>Your event tickets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#dfba7d',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff80',
  },
});
