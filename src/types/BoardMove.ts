import { Intersection } from '../components/Intersection';

export type PlayerColor = 'white' | 'black';

export interface MoveInfo {
  x: number | null;
  y: number | null;
  color: PlayerColor;
  pass: boolean;
  points: Intersection[];
  blackStonesCaptured: number;
  whiteStonesCaptured: number;
  capturedPositions: PlayerMove[];
  koPoint: null | Point;
}

export interface PlayerMove {
  x: number;
  y: number;
  color: PlayerColor;
}

export type Point = Omit<PlayerMove, 'color'>;
