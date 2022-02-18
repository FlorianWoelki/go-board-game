import React from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

const hairlineWidth = 1;
const doubleHairlineWidth = hairlineWidth * 2;

const getHypotenuse = (a: number, b: number): number =>
  Math.sqrt(a ** 2 + b ** 2);

const normalizeIntervals = (
  intervals: number[],
  colors: string[],
  gradientArrayLength: number,
): number[] => {
  if (intervals) {
    if (intervals.length !== colors.length) {
      throw new Error();
    }
    if (!intervals.every((e: any, i: any, a: any) => !i || e > a[i - 1])) {
      throw new Error();
    }
  } else {
    const { length } = colors;
    intervals = [...Array(length)].map((_, i) => i / (length - 1));
  }

  return intervals.map((num: number) => num * (gradientArrayLength - 1));
};

interface RadialGradientProps {
  width: number;
  height: number;
  intervals: number[];
  colors: string[];
  borderRadius: number;
  style?: ViewStyle;
}

export const RadialGradient: React.FC<RadialGradientProps> = ({
  width,
  height,
  style,
  intervals,
  colors,
  borderRadius,
}): JSX.Element => {
  const diagonal = getHypotenuse(height, width);
  const gradientArrayLength = Math.ceil(diagonal / 2 / hairlineWidth);
  const normalIntervals = normalizeIntervals(
    intervals,
    colors,
    gradientArrayLength,
  );

  return (
    <View style={[style, { width, height }]}>
      <View style={[styles.container, { borderRadius }]}>
        <View
          style={{
            marginTop: height / 2,
            alignItems: 'center',
          }}
        >
          {[...Array(gradientArrayLength)].slice(0, undefined).map((_, i) => {
            const size = doubleHairlineWidth * (i + 1);
            return (
              <Animated.View
                key={i}
                style={{
                  zIndex: -i,
                  height: size,
                  width: size,
                  marginTop: -(doubleHairlineWidth * (i + 0.5)),
                  borderRadius: size / 2,
                  backgroundColor: new Animated.Value(i).interpolate({
                    inputRange: normalIntervals,
                    outputRange: colors,
                  }),
                }}
              ></Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // @ts-ignore
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});
