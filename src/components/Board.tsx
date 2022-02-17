import React, { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoveInfo, PlayerColor, Point } from '../types/BoardMove';
import { Intersection } from './Intersection';
import { LineRenderer } from './LineRenderer';
import { useGameLogic } from './hooks/useGameLogic';
import { Button } from './Button';

interface BoardProps {
  size?: number;
}

export const Board: React.FC<BoardProps> = ({ size = 9 }): JSX.Element => {
  const margin = 18;

  const [stoneWidth, setStoneWidth] = useState<number>(0);

  const [intersections, setIntersections] = useState<Intersection[][]>([]);
  const [moves, setMoves] = useState<MoveInfo[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('black');
  const [boardCaptures, setBoardCaptures] = useState<{
    black: number;
    white: number;
  }>({ black: 0, white: 0 });
  const [deadPoints, setDeadPoints] = useState<Point[]>([]);
  const [territoryPoints, setTerritoryPoints] = useState<{
    black: Point[];
    white: Point[];
  }>({ black: [], white: [] });
  const [shouldRenderTerritory, setRenderTerritory] = useState<boolean>(false);
  const {
    stateForPass,
    stateFor,
    wouldBeSuicide,
    hasCapturesFor,
    groupAt,
    neighborsFor,
    clearCapturesFor,
  } = useGameLogic(size, boardCaptures, intersections);

  useEffect(() => {
    const width = Dimensions.get('window').width;
    setStoneWidth((width - margin * 2) / (size - 1));
  }, []);

  const createIntersection = (x: number, y: number): void => {
    const intersection = new Intersection(x, y);
    setIntersections((prevIntersections) => {
      const newIntersections = [...prevIntersections];
      if (newIntersections[0]) {
        newIntersections[0] = [...newIntersections[0]];
      }
      if (!newIntersections[y]) {
        newIntersections[y] = [];
      }

      newIntersections[y][x] = intersection;
      return newIntersections;
    });
  };

  const handleOnTouch = (x: number, y: number): void => {
    if (isIllegalAt(x, y)) {
      console.log('illegal move');
      return;
    }

    if (currentPlayer === 'black') {
      blackAt(x, y);
    } else {
      whiteAt(x, y);
    }

    const blackCapture = (x: number, y: number) => {
      setBoardCaptures((old) => ({ ...old, black: old.black + 1 }));
      removeAt(x, y);
    };

    const whiteCapture = (x: number, y: number) => {
      setBoardCaptures((old) => ({ ...old, white: old.white + 1 }));
      removeAt(x, y);
    };

    const captures = clearCapturesFor(x, y, blackCapture, whiteCapture);
    setMoves((old) => [...old, stateFor(x, y, currentPlayer, captures)]);
  };

  const removeAt = (x: number, y: number) => {
    intersections[y][x].setEmpty();
  };

  const whiteAt = (x: number, y: number) => {
    intersections[y][x].setWhite();
  };

  const blackAt = (x: number, y: number) => {
    intersections[y][x].setBlack();
  };

  const pass = (): void => {
    if (!isGameOver()) {
      moves.push(stateForPass(currentPlayer));
    }
  };

  const isGameOver = (): boolean => {
    if (moves.length < 2) {
      return false;
    }

    const cm = currentMove();
    const pm = moves[moves.length - 2];
    return cm.pass && pm.pass;
  };

  const isIllegalAt = (x: number, y: number): boolean => {
    if (moves.length === 0) {
      return false;
    }

    const intersection = intersections[y][x];

    const isEmpty = intersection.isEmpty();
    const isCapturing = hasCapturesFor(x, y);
    const isSuicide = wouldBeSuicide(x, y, currentPlayer);
    const koPoint = currentMove().koPoint;
    const isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  const currentMove = () => {
    return moves[moves.length - 1];
  };

  const removeScoringState = () => {
    setDeadPoints([]);
    setTerritoryPoints({ black: [], white: [] });
  };

  useEffect(() => {
    const cm = currentMove();

    if (!isGameOver()) {
      removeScoringState();
    }

    const points = cm ? cm.points : intersections.flat();
    points.forEach((intersection: Intersection) => {
      setIntersections((previous) => {
        const updated = [...previous];
        const i = updated[intersection.getY()][intersection.getX()];
        if (i.isEmpty()) {
          i.style = {
            width: 28,
            height: 28,
          };
        } else {
          let color = 'black';
          if (i.isBlack()) {
            color = 'black';
          } else {
            color = 'white';
          }

          i.style = {
            width: stoneWidth / 1.5,
            height: stoneWidth / 1.5,
            borderRadius: 99999,
            backgroundColor: i.isBlack() ? '#333' : '#e8e8e8',
            shadowColor: 'rgb(0, 0, 0)',
            shadowOffset: { width: 2, height: 2 },
            shadowRadius: 1,
            shadowOpacity: 0.5,
            left:
              intersection.getX() * stoneWidth +
              size / 2 -
              stoneWidth / 1.5 / 2,
            top:
              intersection.getY() * stoneWidth +
              size / 2 -
              stoneWidth / 1.5 / 2,
            borderColor: color,
          } as ViewStyle;
        }
        return updated;
      });
    });

    if (!cm) {
      setCurrentPlayer('black');
      setBoardCaptures({ black: 0, white: 0 });
    } else {
      if (cm.color === 'black') {
        setCurrentPlayer('white');
      } else {
        setCurrentPlayer('black');
      }

      if (cm.koPoint) {
        const intersection = intersections[cm.koPoint.y][cm.koPoint.x];
        cm.koPoint = { x: intersection.getX(), y: intersection.getY() };
      } else {
        cm.koPoint = null;
      }

      //if (isGameOver()) {
      //}

      setBoardCaptures({
        black: cm.blackStonesCaptured,
        white: cm.whiteStonesCaptured,
      });

      console.log(currentPlayer, 'played at', cm.x, cm.y);
    }

    setRenderTerritory((old) => !old);
  }, [moves]);

  const renderTerritory = () => {
    setIntersections((previous) => {
      const updated = previous.map((p) =>
        p.map((pp) => {
          if (pp.getValue() === 'empty') {
            pp.style = {};
          }
          return pp;
        }),
      );

      return updated;
    });

    checkTerritory();

    territoryPoints.black.forEach((tp) => {
      setIntersections((previous) => {
        const updated = [...previous];
        const intersection = updated[tp.y][tp.x];
        if (intersection.getValue() === 'empty') {
          intersection.style = {
            width: stoneWidth / 2,
            height: stoneWidth / 2,
            backgroundColor: 'black',
          };
        }
        return updated;
      });
    });

    territoryPoints.white.forEach((tp) => {
      setIntersections((previous) => {
        const updated = [...previous];
        const intersection = updated[tp.y][tp.x];
        if (intersection.getValue() === 'empty') {
          intersection.style = {
            width: stoneWidth / 2,
            height: stoneWidth / 2,
            backgroundColor: 'white',
          };
        }
        return updated;
      });
    });
  };

  useEffect(() => {
    if (moves.length === 0) {
      return;
    }

    renderTerritory();
  }, [shouldRenderTerritory]);

  const checkTerritory = () => {
    setTerritoryPoints({ black: [], white: [] });

    const emptyOrDeadPoints = intersections.flat().filter((i) => {
      return i.isEmpty() || isDeadAt(i.getX(), i.getY());
    });

    let checkedPoints: Intersection[] = [];

    emptyOrDeadPoints.forEach((ep) => {
      if (checkedPoints.indexOf(ep) > -1) {
      } else {
        checkedPoints = checkedPoints.concat(
          checkTerritoryStartingAt(ep.getX(), ep.getY()),
        );
      }
    });
  };

  const surroundedPointsWithBoundaryAt = (
    x: number,
    y: number,
    accumulated: Intersection[] = [],
  ) => {
    const point = intersections[y][x];

    if (accumulated.indexOf(point) > -1) {
      return accumulated;
    }

    accumulated.push(point);

    neighborsFor(point.getX(), point.getY()).filter((neighbor) => {
      if (neighbor.isEmpty() || isDeadAt(neighbor.getX(), neighbor.getY())) {
        surroundedPointsWithBoundaryAt(
          neighbor.getX(),
          neighbor.getY(),
          accumulated,
        );
      } else {
        accumulated.push(neighbor);
      }
    });

    return accumulated;
  };

  const checkTerritoryStartingAt = (x: number, y: number) => {
    const pointsWithBoundary = surroundedPointsWithBoundaryAt(x, y);
    const occupiedPoints = pointsWithBoundary.filter((cp) => {
      return !isDeadAt(cp.getX(), cp.getY()) && !cp.isEmpty();
    });
    const nonOccupiedPoints = pointsWithBoundary.filter((cp) => {
      return isDeadAt(cp.getX(), cp.getY()) || cp.isEmpty();
    });

    const surroundingColors = Array.from(
      new Set(occupiedPoints.map((op) => op.getValue())),
    );

    if (surroundingColors.length === 1 && surroundingColors[0] !== 'empty') {
      const territoryColor = surroundingColors[0];

      nonOccupiedPoints.forEach((nop) => {
        markTerritory(nop.getX(), nop.getY(), territoryColor);
      });
    }

    return nonOccupiedPoints;
  };

  const markTerritory = (x: number, y: number, color: 'black' | 'white') => {
    const pointIsMarkedTerritory = territoryPoints[color].some(
      (point) => point.x === x && point.y === y,
    );

    if (!pointIsMarkedTerritory) {
      const newTerritoryPoints = { ...territoryPoints };
      newTerritoryPoints[color].push({ x, y });
      setTerritoryPoints(newTerritoryPoints);
    }
  };

  const toggleDeadAt = (x: number, y: number) => {
    const alreadyDead = isDeadAt(x, y);

    groupAt(x, y).forEach((intersection) => {
      if (alreadyDead) {
        setDeadPoints((old) =>
          old.filter(
            (dead) =>
              !(
                dead.y === intersection.getY() && dead.x === intersection.getX()
              ),
          ),
        );
      } else {
        setDeadPoints((old) => [
          ...old,
          { x: intersection.getX(), y: intersection.getY() },
        ]);
      }
    });
  };

  const isDeadAt = (x: number, y: number) => {
    return deadPoints.some((dead) => dead.x === x && dead.y === y);
  };

  const score = useMemo(() => {
    const blackDeadAsCaptures = deadPoints.filter((dp) =>
      intersections[dp.y][dp.x].isBlack(),
    );
    const whiteDeadAsCaptures = deadPoints.filter((dp) =>
      intersections[dp.y][dp.x].isWhite(),
    );

    return {
      black:
        territoryPoints.black.length +
        boardCaptures.white +
        whiteDeadAsCaptures.length,
      white:
        territoryPoints.white.length +
        boardCaptures.black +
        blackDeadAsCaptures.length,
    };
  }, [territoryPoints, boardCaptures, deadPoints]);

  const undo = () => {
    setMoves((previous) => {
      const newMoves = [...previous];
      const boardMove = newMoves.pop();
      setIntersections((previous) => {
        if (!boardMove?.x || !boardMove?.y) {
          return previous;
        }

        const updated = [...previous];
        updated[boardMove.y][boardMove.x].setEmpty();
        return updated;
      });
      return newMoves;
    });
  };

  return (
    <>
      <View
        style={{
          marginTop: 18,
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Text style={{ marginRight: margin }}>Black: {score.black}</Text>
        <Text>White: {score.white}</Text>
      </View>
      <View
        style={{
          ...styles.board,
          width: stoneWidth * (size - 1) + size * 1 + margin * 2,
          height: stoneWidth * (size - 1) + size * 1 + margin * 2,
        }}
      >
        <LineRenderer
          dim={{ size, margin, stoneWidth }}
          onCreateIntersection={createIntersection}
        />
        <View
          style={{
            position: 'absolute',
            top: margin - size / 2,
            left: margin - size / 2,
          }}
        >
          {intersections.flat().map((intersection, i) => {
            return (
              <View
                key={i}
                style={{
                  height: stoneWidth / 2,
                  width: stoneWidth / 2,
                  position: 'absolute',
                  left:
                    intersection.getX() * stoneWidth +
                    size / 2 -
                    stoneWidth / 2 / 2,
                  top:
                    intersection.getY() * stoneWidth +
                    size / 2 -
                    stoneWidth / 2 / 2,
                  ...intersection.style,
                }}
                onTouchStart={() => {
                  if (isGameOver()) {
                    toggleDeadAt(intersection.getX(), intersection.getY());
                  } else {
                    handleOnTouch(intersection.getX(), intersection.getY());
                  }
                }}
              >
                {!intersection.isEmpty() && (
                  <LinearGradient
                    colors={
                      intersection.isWhite()
                        ? ['#fff', 'transparent']
                        : ['#505050', 'transparent']
                    }
                    start={{ x: 0.2, y: 0.1 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: stoneWidth / 1.5,
                      width: stoneWidth / 1.5,
                      borderRadius: 15,
                    }}
                  ></LinearGradient>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ display: 'flex', margin }}>
        <Button
          title="Undo"
          onPress={undo}
          disabled={moves.length === 0}
        ></Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#dfbd6d',
  },
});
