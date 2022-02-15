import { MoveInfo, PlayerColor } from '../../types/BoardMove';
import { Intersection } from '../Intersection';

export const useGameLogic = (
  size: number,
  boardCaptures: { black: number; white: number },
  intersections: Intersection[][],
) => {
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

  const inAtari = (x: number, y: number): boolean => {
    return libertiesAt(x, y) === 1;
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

  const wouldBeSuicide = (
    x: number,
    y: number,
    currentPlayer: PlayerColor,
  ): boolean => {
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

  const clearCapturesFor = (
    x: number,
    y: number,
    addBlackCapture: (x: number, y: number) => void,
    addWhiteCapture: (x: number, y: number) => void,
  ) => {
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
        addBlackCapture(cs.getX(), cs.getY());
      } else {
        addWhiteCapture(cs.getX(), cs.getY());
      }
    });

    return capturedStones;
  };

  const stateForPass = (currentPlayer: PlayerColor): MoveInfo => {
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

  const stateFor = (
    x: number,
    y: number,
    currentPlayer: PlayerColor,
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
        color: currentPlayer === 'black' ? 'white' : 'black',
      })),
      koPoint: null,
    };

    if (isKoFrom(x, y, captures)) {
      moveInfo.koPoint = { x: captures[0].getX(), y: captures[0].getY() };
    }

    return moveInfo;
  };

  return {
    stateForPass,
    stateFor,
    groupAt,
    neighborsFor,
    libertiesAt,
    inAtari,
    isKoFrom,
    hasCapturesFor,
    wouldBeSuicide,
    clearCapturesFor,
  };
};
