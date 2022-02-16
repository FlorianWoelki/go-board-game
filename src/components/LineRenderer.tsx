import React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
        style: { ...styles.lineVertical, marginRight: dim.stoneWidth },
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
          width: dim.stoneWidth * (dim.size - 1) + dim.size * 1,
          height: dim.stoneWidth * (dim.size - 1) + dim.size * 1,
        }}
      >
        {horizontalLines.map((hl, i) => (
          <View key={i} style={hl.style}></View>
        ))}
      </View>
      <View
        style={{
          ...styles.verticalLines,
          margin: dim.margin,
          width: dim.stoneWidth * (dim.size - 1) + dim.size * 1,
          height: dim.stoneWidth * (dim.size - 1) + dim.size * 1,
        }}
      >
        {verticalLines.map((vl, i) => (
          <View key={i} style={vl.style}></View>
        ))}
      </View>
      {hoshiPoints.map((hp, i) => (
        <View key={i} style={hp.style}></View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  horizontalLines: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  verticalLines: {
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
