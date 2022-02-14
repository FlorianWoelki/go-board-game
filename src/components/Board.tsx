import React from 'react';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import { Intersection } from './Intersection';

type PlayerColor = 'white' | 'black';

interface Move {
  x: number;
  y: number;
  color: PlayerColor;
}

interface MoveInfo {
  x: number | null;
  y: number | null;
  color: PlayerColor;
  pass: boolean;
  points: Intersection[];
  blackStonesCaptured: number;
  whiteStonesCaptured: number;
  capturedPositions: Move[];
  koPoint: null | Omit<Move, 'color'>;
}

export const Board: React.FC = (): JSX.Element => {
  const hoshiOffset = 2; // offset for 9x9 board
  const margin = 18;
  const [stoneWidth, setStoneWidth] = useState<number>(0);
  const boardSize = 9;

  const [hoshiPoints, setHoshiPoints] = useState<any[]>([]);
  const [verticalLines, setVerticalLines] = useState<any[]>([]);
  const [horizontalLines, setHorizontalLines] = useState<any[]>([]);
  const [intersections, _] = useState<Intersection[][]>([]);
  const [intersectionElements, setIntersectionElements] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('black');
  const [boardCaptures, setBoardCaptures] = useState<{
    black: number;
    white: number;
  }>({ black: 0, white: 0 });
  const [deadPoints, setDeadPoints] = useState<Omit<Move, 'color'>[]>([]);
  const [territoryPoints, setTerritoryPoints] = useState<{
    black: Omit<Move, 'color'>[];
    white: Omit<Move, 'color'>[];
  }>({ black: [], white: [] });

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

        const hoshiPoint = { style: { ...styles.hoshi, ...hoshiStyle } };
        setHoshiPoints((oldHoshiPoints) => [...oldHoshiPoints, hoshiPoint]);
      }
    }

    for (let y = 0; y < boardSize; y++) {
      const horizontalLine = {
        style: { ...styles.lineHorizontal, marginBottom: stoneWidth },
      };
      setHorizontalLines((old) => [...old, horizontalLine]);

      const verticalLine = {
        style: { ...styles.lineVertical, marginRight: stoneWidth },
      };
      setVerticalLines((old) => [...old, verticalLine]);

      for (let x = 0; x < boardSize; x++) {
        const intersection = new Intersection(x, y);
        if (!intersections[y]) {
          intersections[y] = [];
        }

        intersections[y][x] = intersection;
        setIntersectionElements((old) => [
          ...old,
          { ...intersection, style: {} },
        ]);
      }
    }
  }, [stoneWidth]);

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

    if (x < boardSize - 1) {
      neighbors.push(intersections[y][x + 1]);
    }

    if (y > 0) {
      neighbors.push(intersections[y - 1][x]);
    }

    if (y < boardSize - 1) {
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
      intersections[intersection.getY()][intersection.getX()] =
        intersection.duplicate();

      const intersectionEl = intersectionElements.find(
        (ie) => ie.x === intersection.getX() && ie.y === intersection.getY(),
      );

      if (intersection.isEmpty()) {
        intersectionEl.style = {
          width: 28,
          height: 28,
        };
      } else {
        let color = 'black';
        if (intersection.isBlack()) {
          color = 'black';
        } else {
          color = 'white';
        }

        intersectionEl.style = {
          width: 28 - 1,
          height: 28 - 1,
          borderRadius: 28 / 2,
          backgroundColor: color,
          borderColor: color,
        } as ViewStyle;
      }

      setIntersectionElements([...intersectionElements]);
    });

    if (cm.koPoint) {
      cm.koPoint = intersections[cm.koPoint.y][cm.koPoint.x];
    } else {
      cm.koPoint = null;
    }

    setBoardCaptures({
      black: cm.blackStonesCaptured,
      white: cm.whiteStonesCaptured,
    });

    if (isGameOver()) {
      renderTerritory();
    }

    console.log(currentPlayer, 'played at', cm.x, cm.y);
  }, [moves]);

  const renderTerritory = () => {
    intersections.flat().forEach((i) => {
      const intersectionEl = intersectionElements.find(
        (ie) => ie.x === i.getX() && ie.y === i.getY(),
      );

      if (isDeadAt(i.getX(), i.getY())) {
        intersectionEl.style = {};
      } else {
      }

      setIntersectionElements([...intersectionElements]);
    });

    checkTerritory();

    territoryPoints.black.forEach((tp) => {
      const intersectionEl = intersectionElements.find(
        (ie) => ie.x === tp.x && ie.y === tp.y,
      );
      intersectionEl.style = {
        ...intersectionEl.style,
        width: 28 / 4,
        height: 28 / 4,
        marginLeft: 1,
        marginTop: 1,
        backgroundColor: 'black',
      };
      setIntersectionElements([...intersectionElements]);
    });

    territoryPoints.white.forEach((tp) => {
      const intersectionEl = intersectionElements.find(
        (ie) => ie.x === tp.x && ie.y === tp.y,
      );
      intersectionEl.style = {
        ...intersectionEl.style,
        width: 28 / 4,
        height: 28 / 4,
        marginLeft: 1,
        marginTop: 1,
        backgroundColor: 'white',
      };
      setIntersectionElements([...intersectionElements]);
    });
  };

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
      territoryPoints[color].push({ x: x, y: y });
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

  const score = () => {
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
  };

  return (
    <View
      style={{
        ...styles.board,
        width: stoneWidth * (boardSize - 1) + boardSize * 1 + margin * 2,
        height: stoneWidth * (boardSize - 1) + boardSize * 1 + margin * 2,
      }}
    >
      <View
        style={{
          ...styles.horizontalLines,
          width: stoneWidth * (boardSize - 1) + boardSize * 1,
          height: stoneWidth * (boardSize - 1) + boardSize * 1,
        }}
      >
        {horizontalLines.map((hl, i) => (
          <View key={i} style={hl.style}></View>
        ))}
      </View>
      <View
        style={{
          ...styles.verticalLines,
          width: stoneWidth * (boardSize - 1) + boardSize * 1,
          height: stoneWidth * (boardSize - 1) + boardSize * 1,
        }}
      >
        {verticalLines.map((vl, i) => (
          <View key={i} style={vl.style}></View>
        ))}
      </View>
      {hoshiPoints.map((hp, i) => (
        <View key={i} style={hp.style}></View>
      ))}
      <View
        style={{
          position: 'absolute',
          top: 18 - boardSize / 2,
          left: 18 - boardSize / 2,
        }}
      >
        {intersectionElements.map((intersection, i) => (
          <View
            key={i}
            style={{
              height: 28,
              width: 28,
              position: 'absolute',
              marginLeft: -8,
              marginTop: -8,
              left: intersection.x * (stoneWidth + 1),
              top: intersection.y * (stoneWidth + 1),
              ...intersection.style,
            }}
            onTouchStart={() => {
              if (isGameOver()) {
                toggleDeadAt(intersection.x, intersection.y);
              } else {
                handleOnTouch(intersection.x, intersection.y);
              }
            }}
          ></View>
        ))}
      </View>
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
