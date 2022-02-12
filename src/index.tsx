import React from 'react';

import Board from './components/Board';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: 'rgb(226, 188, 106)',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <Board />
    </SafeAreaView>
  );
}
