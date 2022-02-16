import React, { useEffect, useState } from 'react';
import { ViewStyle } from 'react-native';
import { BoardDimension } from '../../types/BoardDimension';
import { ViewStyleObject } from '../../types/ViewStyleObject';

export const useHoshiPoints = (
  { size, margin, stoneWidth }: BoardDimension,
  defaultStyle: any,
  deps: React.DependencyList | undefined,
): ViewStyleObject[] => {
  const [hoshiPoints, setHoshiPoints] = useState<ViewStyleObject[]>([]);

  useEffect(() => {
    if (!stoneWidth) {
      return;
    }

    for (let hoshiY = 0; hoshiY < 3; hoshiY++) {
      for (let hoshiX = 0; hoshiX < 3; hoshiX++) {
        const hoshiStyle: ViewStyle = {};
        const hoshiOffset = size > 9 ? 3 : 2;
        if (hoshiY === 0) {
          hoshiStyle.top = margin + hoshiOffset * stoneWidth - 2;
        }
        if (hoshiY === 1) {
          hoshiStyle.top = margin + ((size + 1) / 2 - 1) * stoneWidth - 2;
        }
        if (hoshiY === 2) {
          hoshiStyle.top = margin + (size - hoshiOffset - 1) * stoneWidth - 2;
        }

        if (hoshiX === 0) {
          hoshiStyle.left = margin + hoshiOffset * stoneWidth - 2;
        }
        if (hoshiX === 1) {
          hoshiStyle.left = margin + ((size + 1) / 2 - 1) * stoneWidth - 2;
        }
        if (hoshiX === 2) {
          hoshiStyle.left = margin + (size - hoshiOffset - 1) * stoneWidth - 2;
        }

        const hoshiPoint = { style: { ...defaultStyle, ...hoshiStyle } };
        setHoshiPoints((oldHoshiPoints) => [...oldHoshiPoints, hoshiPoint]);
      }
    }
  }, deps);

  return hoshiPoints;
};
