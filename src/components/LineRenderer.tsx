import React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BoardDimension } from '../types/BoardDimension';
import { ViewStyleObject } from '../types/ViewStyleObject';
import { useHoshiPoints } from './hooks/useHoshiPoints';

interface LineRendererProps {
  dim: BoardDimension;
  onCreateIntersection: (x: number, y: number) => void;
}

export const LineRenderer: React.FC<LineRendererProps> = ({
  dim,
  onCreateIntersection,
}): JSX.Element => {
  const hoshiPoints = useHoshiPoints({ ...dim }, styles.hoshi, [
    dim.stoneWidth,
  ]);
  const [verticalLines, setVerticalLines] = useState<ViewStyleObject[]>([]);
  const [horizontalLines, setHorizontalLines] = useState<ViewStyleObject[]>([]);

  useEffect(() => {
    if (!dim.stoneWidth) {
      return;
    }

    for (let y = 0; y < dim.size; y++) {
      const horizontalLine = {
        style: { ...styles.lineHorizontal, marginBottom: dim.stoneWidth },
      };
      setHorizontalLines((old) => [...old, horizontalLine]);

      const verticalLine = {
        style: {
          ...styles.lineVertical,
        },
      };
      setVerticalLines((old) => [...old, verticalLine]);

      for (let x = 0; x < dim.size; x++) {
        onCreateIntersection(x, y);
      }
    }
  }, [dim.stoneWidth]);

  return (
    <>
      <View
        style={{
          ...styles.horizontalLines,
          margin: dim.margin,
          width: Dimensions.get('window').width - dim.margin * 2,
        }}
      >
        {horizontalLines.map((hl, i) => (
          <View
            key={i}
            style={{
              ...hl.style,
              position: 'absolute',
              marginTop: dim.stoneWidth * i,
            }}
          ></View>
        ))}
      </View>
      <View
        style={{
          ...styles.verticalLines,
          margin: dim.margin,
          position: 'absolute',
          height: Dimensions.get('window').width - dim.margin * 2 + 1,
        }}
      >
        {verticalLines.map((vl, i) => (
          <View
            key={i}
            style={{
              ...vl.style,
              position: 'absolute',
              marginLeft: dim.stoneWidth * i,
            }}
          ></View>
        ))}
      </View>
      {hoshiPoints.map((hp, i) => (
        <View key={i} style={hp.style}></View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  horizontalLines: {},
  verticalLines: {},
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
