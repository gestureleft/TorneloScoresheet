import { ChessPly, GameTime } from './ChessMove';

export enum UndoActionType {
  ReplaceMoves,
  ToggleDrawOffer,
  EditTimeForMove,
  Move,
}

export type ReplaceMovesAction = {
  type: UndoActionType.ReplaceMoves;
  indexOfPlyInHistory: number;
  replacedMoves: ChessPly[];
};

export type ToggleDrawOfferAction = {
  type: UndoActionType.ToggleDrawOffer;
  indexOfPlyInHistory: number;
};

export type EditTimeForMoveAction = {
  type: UndoActionType.EditTimeForMove;
  indexOfPlyInHistory: number;
  gameTime?: GameTime;
};

export type MoveAction = {
  type: UndoActionType.Move;
};

export type UndoAction =
  | ReplaceMovesAction
  | EditTimeForMoveAction
  | ToggleDrawOfferAction
  | MoveAction;
