import React, { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle, Text } from 'react-native';
import { MoveInfo, PlayerColor, Point } from '../types/BoardMove';
import { Intersection } from './Intersection';
import { LineRenderer } from './LineRenderer';

interface BoardProps {
  size?: number;
}

export const Board: React.FC<BoardProps> = ({ size = 9 }): JSX.Element => {
  const margin = 18;
  const boardSizeOffset = { 9: 0, 13: 1, 19: 2 };

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

  useEffect(() => {
    setStoneWidth(
      Math.round(
        Dimensions.get('window').width / size -
          boardSizeOffset[size as keyof typeof boardSizeOffset],
      ),
    );
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

    const captures = clearCapturesFor(x, y);
    setMoves((old) => [...old, stateFor(x, y, captures)]);
  };

  const groupAt = (x: number, y: number, accumulated: Intersection[] = []) => {
    const point = intersections[y][x];

    if (accumulated.indexOf(point) > -1) {
      return accumulated;
    }

    accumulated.push(point);

    neighborsFor(point.getX(), point.getY())
      .filter((neighbor) => {
        return !neighbor.isEmpty();
      })
      .forEach((neighbor) => {
        if (neighbor.sameColorAs(point)) {
          groupAt(neighbor.getX(), neighbor.getY(), accumulated);
        }
      });

    return accumulated;
  };

  const clearCapturesFor = (x: number, y: number) => {
    const point = intersections[y][x];
    const capturedNeighbors = neighborsFor(point.getX(), point.getY()).filter(
      (neighbor) => {
        return (
          !neighbor.isEmpty() &&
          !neighbor.sameColorAs(point) &&
          libertiesAt(neighbor.getX(), neighbor.getY()) === 0
        );
      },
    );

    const capturedStones = capturedNeighbors
      .map((neighbor) => {
        return groupAt(neighbor.getX(), neighbor.getY());
      })
      .flat();

    capturedStones.forEach((cs) => {
      if (cs.isBlack()) {
        setBoardCaptures((old) => ({ ...old, black: old.black + 1 }));
      } else {
        setBoardCaptures((old) => ({ ...old, white: old.white + 1 }));
      }

      removeAt(cs.getX(), cs.getY());
    });

    return capturedStones;
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

  const stateForPass = (): MoveInfo => {
    return {
      x: null,
      y: null,
      color: currentPlayer,
      pass: true,
      points: intersections.flat().map((i) => i.duplicate()),
      blackStonesCaptured: boardCaptures.black,
      whiteStonesCaptured: boardCaptures.white,
      capturedPositions: [],
      koPoint: null,
    };
  };

  const pass = (): void => {
    if (!isGameOver()) {
      moves.push(stateForPass());
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

  const stateFor = (
    x: number,
    y: number,
    captures: Intersection[],
  ): MoveInfo => {
    const moveInfo: MoveInfo = {
      x: x,
      y: y,
      color: currentPlayer,
      pass: false,
      points: intersections.flat().map((i) => i.duplicate()),
      blackStonesCaptured: boardCaptures.black,
      whiteStonesCaptured: boardCaptures.white,
      capturedPositions: captures.map((c) => ({
        x: c.getX(),
        y: c.getY(),
        color: isBlackPlaying() ? 'white' : 'black',
      })),
      koPoint: null,
    };

    if (isKoFrom(x, y, captures)) {
      moveInfo.koPoint = { x: captures[0].getX(), y: captures[0].getY() };
    }

    return moveInfo;
  };

  const isKoFrom = (
    x: number,
    y: number,
    captures: Intersection[],
  ): boolean => {
    const point = intersections[y][x];
    return (
      captures.length === 1 &&
      groupAt(point.getX(), point.getY()).length === 1 &&
      inAtari(point.getX(), point.getY())
    );
  };

  const inAtari = (x: number, y: number): boolean => {
    return libertiesAt(x, y) === 1;
  };

  const isBlackPlaying = (): boolean => {
    return currentPlayer === 'black';
  };

  const neighborsFor = (x: number, y: number): Intersection[] => {
    const neighbors = [];

    if (x > 0) {
      neighbors.push(intersections[y][x - 1]);
    }

    if (x < size - 1) {
      neighbors.push(intersections[y][x + 1]);
    }

    if (y > 0) {
      neighbors.push(intersections[y - 1][x]);
    }

    if (y < size - 1) {
      neighbors.push(intersections[y + 1][x]);
    }

    return neighbors;
  };

  const hasCapturesFor = (x: number, y: number): boolean => {
    const point = intersections[y][x];
    const capturedNeighbors = neighborsFor(point.getX(), point.getY()).filter(
      (neighbor) => {
        return (
          !neighbor.isEmpty() &&
          !neighbor.sameColorAs(point) &&
          libertiesAt(neighbor.getX(), neighbor.getY()) === 0
        );
      },
    );

    return capturedNeighbors.length > 0;
  };

  const libertiesAt = (x: number, y: number) => {
    const point = intersections[y][x];

    const emptyPoints = groupAt(point.getX(), point.getY())
      .flat()
      .map((groupPoint) => {
        return neighborsFor(groupPoint.getX(), groupPoint.getY()).filter(
          (i) => {
            return i.isEmpty();
          },
        );
      });

    return Array.from(
      new Set(emptyPoints.flat().map((ee) => ee.getY() + '-' + ee.getX())),
    ).length;
  };

  const wouldBeSuicide = (x: number, y: number): boolean => {
    const intersection = intersections[y][x];
    const surroundedEmptyPoint =
      intersection.isEmpty() &&
      neighborsFor(intersection.getX(), intersection.getY()).filter(
        (neighbor) => neighbor.isEmpty(),
      ).length === 0;
    if (!surroundedEmptyPoint) {
      return false;
    }

    let suicide = true;
    const friendlyNeighbors = neighborsFor(
      intersection.getX(),
      intersection.getY(),
    ).filter((neighbor) => {
      return neighbor.isOccupiedWith(currentPlayer);
    });

    const someFriendlyNotInAtari = neighborsFor(
      intersection.getX(),
      intersection.getY(),
    ).some((neighbor) => {
      const atari = inAtari(neighbor.getX(), neighbor.getY());
      const friendly = neighbor.isOccupiedWith(currentPlayer);

      return friendly && !atari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    const someEnemyInAtari = neighborsFor(
      intersection.getX(),
      intersection.getY(),
    ).some((neighbor) => {
      const atari = inAtari(neighbor.getX(), neighbor.getY());
      const enemy = !neighbor.isOccupiedWith(currentPlayer);

      return atari && enemy;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  };

  const isIllegalAt = (x: number, y: number): boolean => {
    if (moves.length === 0) {
      return false;
    }

    const intersection = intersections[y][x];

    const isEmpty = intersection.isEmpty();
    const isCapturing = hasCapturesFor(x, y);
    const isSuicide = wouldBeSuicide(x, y);
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

    if (!cm) {
      setCurrentPlayer('black');
      setBoardCaptures({ black: 0, white: 0 });
      return;
    }

    if (cm.color === 'black') {
      setCurrentPlayer('white');
    } else {
      setCurrentPlayer('black');
    }

    cm.points.forEach((intersection: Intersection) => {
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
            width: 28 - 1,
            height: 28 - 1,
            borderRadius: 28 / 2,
            backgroundColor: color,
            borderColor: color,
          } as ViewStyle;
        }
        return updated;
      });
    });

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
            width: 28 / 4,
            height: 28 / 4,
            marginLeft: 1,
            marginTop: 1,
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
            width: 28 / 4,
            height: 28 / 4,
            marginLeft: 1,
            marginTop: 1,
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

  return (
    <>
      <View
        style={{
          marginTop: 18,
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Text style={{ marginRight: 16 }}>Black: {score.black}</Text>
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
            top: 18 - size / 2,
            left: 18 - size / 2,
          }}
        >
          {intersections.flat().map((intersection, i) => {
            return (
              <View
                key={i}
                style={{
                  height: 28,
                  width: 28,
                  position: 'absolute',
                  marginLeft: -8,
                  marginTop: -8,
                  left: intersection.getX() * (stoneWidth + 1),
                  top: intersection.getY() * (stoneWidth + 1),
                  ...intersection.style,
                }}
                onTouchStart={() => {
                  if (isGameOver()) {
                    toggleDeadAt(intersection.getX(), intersection.getY());
                  } else {
                    handleOnTouch(intersection.getX(), intersection.getY());
                  }
                }}
              ></View>
            );
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: 'rgb(226, 188, 106)',
  },
});
