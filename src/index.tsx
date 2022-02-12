import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';

import { Board } from './components/Board';

export default function App() {
  const backgroundStyle = {
    backgroundColor: 'rgb(226, 188, 106)',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar />

      <Board />
    </SafeAreaView>
  );
}
