import { Moment } from 'moment';
import { Position } from './ChessBoardPositions';
import { PlayerColour } from './ChessGameInfo';

export enum PieceType {
  Pawn,
  Knight,
  Bishop,
  Rook,
  Queen,
  King,
}

export type Piece = {
  type: PieceType;
  player: PlayerColour;
};

export type ChessPly = {
  squares?: PlySquares;
  startingFen: string;
  // Whether or not a draw was offered
  drawOffer: boolean;
  time?: Moment;
};

export type PlySquares = {
  from: Position;
  to: Position;
};

export type ChessMove = {
  whitePly: ChessPly;
  blackPly?: ChessPly;
  moveNo: number;
};
