import { ChessPly, GameTime } from './ChessMove';

export enum ReversibleActionType {
  ReplaceMoves,
  ToggleDrawOffer,
  EditTimeForMove,
  Move,
}

export type ReplaceMovesAction = {
  type: ReversibleActionType.ReplaceMoves;
  indexOfPlyInHistory: number;
  replacedMoves: ChessPly[];
};

export type ToggleDrawOfferAction = {
  type: ReversibleActionType.ToggleDrawOffer;
  indexOfPlyInHistory: number;
};

export type EditTimeForMoveAction = {
  type: ReversibleActionType.EditTimeForMove;
  indexOfPlyInHistory: number;
  previousGameTime?: GameTime;
};

export type MoveAction = {
  type: ReversibleActionType.Move;
};

// An action that can be "undone"
export type ReversibleAction =
  | ReplaceMovesAction
  | ReplaceMovesAction
  | ToggleDrawOfferAction
  | MoveAction;