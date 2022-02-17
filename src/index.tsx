import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';

import { Board } from './components/Board';

export default function App() {
  return (
    <SafeAreaView style={{ backgroundColor: '#dfbd6d' }}>
      <StatusBar />

      <Board size={9} />
    </SafeAreaView>
  );
}
