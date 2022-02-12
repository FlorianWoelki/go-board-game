import React from 'react';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';

import Board from './components/Board';

const App = () => {
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
};

export default App;
