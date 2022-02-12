import React from 'react';
import {useEffect, useState} from 'react';
import {Dimensions, StyleSheet, View, ViewStyle} from 'react-native';

const Board: React.FC = (): JSX.Element => {
  const hoshiOffset = 2; // offset for 9x9 board
  const margin = 18;
  const [stoneWidth, setStoneWidth] = useState<number>(0);
  const boardSize = 9;

  const [hoshiPoints, setHoshiPoints] = useState<any[]>([]);
  const [grid, setGrid] = useState<any[][]>([]);
  const [verticalLines, setVerticalLines] = useState<any[]>([]);
  const [horizontalLines, setHorizontalLines] = useState<any[]>([]);

  useEffect(() => {
    setStoneWidth(Math.round(Dimensions.get('window').width / boardSize));

    setVerticalLines([]);
    setHorizontalLines([]);
    setHoshiPoints([]);
  }, []);

  useEffect(() => {
    if (!stoneWidth) {
      return;
    }

    for (let hoshiY = 0; hoshiY < 3; hoshiY++) {
      for (let hoshiX = 0; hoshiX < 3; hoshiX++) {
        const hoshiStyle: ViewStyle = {};
        if (hoshiY === 0) {
          hoshiStyle.top = margin + hoshiOffset * (stoneWidth + 1) - 2;
        }
        if (hoshiY === 1) {
          hoshiStyle.top =
            margin + ((boardSize + 1) / 2 - 1) * (stoneWidth + 1) - 2;
        }
        if (hoshiY === 2) {
          hoshiStyle.top =
            margin + (boardSize - hoshiOffset - 1) * (stoneWidth + 1) - 2;
        }

        if (hoshiX === 0) {
          hoshiStyle.left = margin + hoshiOffset * (stoneWidth + 1) - 2;
        }
        if (hoshiX === 1) {
          hoshiStyle.left =
            margin + ((boardSize + 1) / 2 - 1) * (stoneWidth + 1) - 2;
        }
        if (hoshiX === 2) {
          hoshiStyle.left =
            margin + (boardSize - hoshiOffset - 1) * (stoneWidth + 1) - 2;
        }

        const hoshiPoint = {style: {...styles.hoshi, ...hoshiStyle}};
        setHoshiPoints(oldHoshiPoints => [...oldHoshiPoints, hoshiPoint]);
      }
    }

    for (let y = 0; y < boardSize; y++) {
      const horizontalLine = {
        style: {...styles.lineHorizontal, marginBottom: stoneWidth},
      };
      setHorizontalLines(old => [...old, horizontalLine]);

      const verticalLine = {
        style: {...styles.lineVertical, marginRight: stoneWidth},
      };
      setVerticalLines(old => [...old, verticalLine]);

      for (let x = 0; x < boardSize; x++) {
        const intersectionElement = (
          <View
            style={{
              left: x * (stoneWidth + 1),
              top: y * (stoneWidth + 1),
            }}
            data-position-x={x}
            data-position-y={y}></View>
        );

        if (!grid[y]) {
          grid[y] = [];
        }

        grid[y][x] = intersectionElement;
      }
    }
  }, [stoneWidth]);

  return (
    <View
      style={{
        ...styles.board,
        width: stoneWidth * (boardSize - 1) + boardSize * 1 + margin * 2,
        height: stoneWidth * (boardSize - 1) + boardSize * 1 + margin * 2,
      }}>
      <View
        style={{
          ...styles.horizontalLines,
          width: stoneWidth * (boardSize - 1) + boardSize * 1,
          height: stoneWidth * (boardSize - 1) + boardSize * 1,
        }}>
        {horizontalLines.map((hl, i) => (
          <View key={i} style={hl.style}></View>
        ))}
      </View>
      <View
        style={{
          ...styles.verticalLines,
          width: stoneWidth * (boardSize - 1) + boardSize * 1,
          height: stoneWidth * (boardSize - 1) + boardSize * 1,
        }}>
        {verticalLines.map((vl, i) => (
          <View key={i} style={vl.style}></View>
        ))}
      </View>
      {hoshiPoints.map((hp, i) => (
        <View key={i} style={hp.style}></View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: 'rgb(226, 188, 106)',
  },
  horizontalLines: {
    margin: 18,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  verticalLines: {
    margin: 18,
    flexDirection: 'row',
  },
  lineHorizontal: {
    backgroundColor: 'rgb(135, 113, 63)',
    height: 1,
    width: '100%',
  },
  lineVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgb(135, 113, 63)',
  },
  hoshi: {
    width: 2 * 2 + 1,
    height: 2 * 2 + 1,
    borderRadius: 2 * 2 + 1,
    backgroundColor: 'rgb(135, 113, 63)',
    position: 'absolute',
  },
});

export default Board;
