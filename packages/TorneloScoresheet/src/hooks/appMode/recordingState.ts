import { useContext } from 'react';
import { chessEngine } from '../../chessEngine/chessEngineInterface';
import { MoveReturnType } from '../../chessEngine/chessTsChessEngine';
import {
  AppMode,
  AppModeState,
  RecordingMode as recordingMode,
} from '../../types/AppModeState';
import { ChessGameResult, PlayerColour } from '../../types/ChessGameInfo';
import {
  ChessPly,
  MovePly,
  MoveSquares,
  PieceType,
  PlyTypes,
  SkipPly,
} from '../../types/ChessMove';
import { Result } from '../../types/Result';
import { UndoActionType } from '../../types/UndoAction';
import { getCurrentFen } from '../../util/moveHistory';
import { storeRecordingModeData } from '../../util/storage';
import { undoAction } from './undoAction';

type recordingStateHookType = [
  recordingMode,
  {
    goToEndGame: (result: ChessGameResult) => void;
    goToTextInput: () => void;
    goToArbiterGameMode: () => void;
    move: (moveSquares: MoveSquares, promotion?: PieceType) => void;
    undoLastAction: () => void;
    isPawnPromotion: (moveSquares: MoveSquares) => boolean;
    skipTurn: () => void;
    isOtherPlayersPiece: (move: MoveSquares) => boolean;
    skipTurnAndProcessMove: (move: MoveSquares, promotion?: PieceType) => void;
    generatePgn: (winner: PlayerColour | null) => Result<string>;
    toggleDraw: (drawIndex: number) => void;
    toggleRecordingMode: () => void;
    goToEditMove: (index: number) => void;
  },
];

/**
 * Skips a player's turn
 * Will Return the next move history array
 * @param moveHistory ChessPly array of past moves
 * @returns new moveHistory array
 */
const skipPlayerTurn = (moveHistory: ChessPly[]): ChessPly[] => {
  const nextPly: SkipPly = {
    startingFen: getCurrentFen(moveHistory),
    type: PlyTypes.SkipPly,
    moveNo: Math.floor(moveHistory.length / 2) + 1,
    player:
      moveHistory.length % 2 === 0 ? PlayerColour.White : PlayerColour.Black,
    drawOffer: false,
  };
  return [...moveHistory, nextPly];
};

/**
 * Processes a player's move given to and from positons
 * Will Return the next move history array
 * Will return null if move is impossible
 * @param moveSquares from and to positions
 * @param moveHistory ChessPly array of past moves
 * @returns new moveHistory array or null
 */
const processPlayerMove = (
  moveSquares: MoveSquares,
  moveHistory: ChessPly[],
  promotion?: PieceType,
): ChessPly[] | null => {
  const startingFen = getCurrentFen(moveHistory);

  // process move
  const moveSAN = chessEngine.makeMove(
    startingFen,
    moveSquares,
    promotion,
    MoveReturnType.MOVE_SAN,
  );

  // return null if move is impossible
  if (!moveSAN) {
    return null;
  }

  // build next play and return new history
  const nextPly: MovePly = {
    startingFen,
    move: moveSquares,
    type: PlyTypes.MovePly,
    moveNo: Math.floor(moveHistory.length / 2) + 1,
    player:
      moveHistory.length % 2 === 0 ? PlayerColour.White : PlayerColour.Black,
    promotion,
    drawOffer: false,
    san: moveSAN,
  };

  return [...moveHistory, nextPly];
};

export const makeUseRecordingState =
  (
    context: React.Context<
      [AppModeState, React.Dispatch<React.SetStateAction<AppModeState>>]
    >,
  ): (() => recordingStateHookType | null) =>
  (): recordingStateHookType | null => {
    const [appModeState, setAppModeState] = useContext(context);

    if (appModeState.mode !== AppMode.Recording) {
      return null;
    }
    const updateBoard = (moveHistory: ChessPly[]): void => {
      const board = chessEngine.fenToBoardPositions(getCurrentFen(moveHistory));
      setAppModeState({
        ...appModeState,
        board,
        moveHistory,
      });
    };

    const goToEditMove = (index: number): void => {
      // store the move history array and current player to memory
      storeRecordingModeData({
        moveHistory: appModeState.moveHistory,
        currentPlayer: appModeState.currentPlayer,
        startTime: appModeState.startTime,
      });

      setAppModeState({
        mode: AppMode.EditMove,
        pairing: appModeState.pairing,
        moveHistory: appModeState.moveHistory,
        editingIndex: index,
        currentPlayer: appModeState.currentPlayer,
        board: chessEngine.fenToBoardPositions(
          appModeState.moveHistory[index]?.startingFen ??
            chessEngine.startingFen(),
        ),
      });
    };

    const goToEndGame = (result: ChessGameResult): void => {
      // store the move history array and current player to memory
      storeRecordingModeData({
        moveHistory: appModeState.moveHistory,
        currentPlayer: appModeState.currentPlayer,
        startTime: appModeState.startTime,
      });

      // set state to results display
      setAppModeState({
        mode: AppMode.ResultDisplay,
        pairing: appModeState.pairing,
        result,
      });
    };

    const goToTextInput = (): void => {};

    const goToArbiterGameMode = (): void => {
      setAppModeState({
        ...appModeState,
        mode: AppMode.ArbiterRecording,
      });
    };

    const move = (moveSquares: MoveSquares, promotion?: PieceType): void => {
      setAppModeState(state => {
        if (state.mode !== AppMode.Recording) {
          return state;
        }
        const moveHistory = processPlayerMove(
          moveSquares,
          state.moveHistory,
          promotion,
        );
        if (moveHistory === null) {
          return state;
        }
        const board = chessEngine.fenToBoardPositions(
          getCurrentFen(moveHistory),
        );

        return {
          ...state,
          board,
          moveHistory,
          undoStack: state.undoStack.concat([
            {
              type: UndoActionType.Move,
            },
          ]),
        };
      });
    };

    const isPawnPromotion = (moveSquares: MoveSquares): boolean => {
      const fen = getCurrentFen(appModeState.moveHistory);
      return chessEngine.isPawnPromotion(fen, moveSquares);
    };

    const undoLastAction = (): void => {
      setAppModeState(state => {
        if (state.mode !== AppMode.Recording) {
          return state;
        }
        const action = state.undoStack.at(-1);

        if (!action) {
          return state;
        }

        const updatedState = undoAction(state, action);

        return {
          ...updatedState,
          undoStack: state.undoStack.filter(
            (_, index) => index !== state.undoStack.length - 1,
          ),
        };
      });
    };

    const skipTurn = (): void => {
      setAppModeState(state => {
        if (state.mode !== AppMode.Recording) {
          return state;
        }
        const moveHistory = skipPlayerTurn(state.moveHistory);
        const board = chessEngine.fenToBoardPositions(
          getCurrentFen(moveHistory),
        );
        return {
          ...state,
          moveHistory,
          board,
          undoStack: state.undoStack.concat([
            {
              type: UndoActionType.Move,
            },
          ]),
        };
      });
    };

    const isOtherPlayersPiece = (moveSquares: MoveSquares): boolean => {
      return chessEngine.isOtherPlayersPiece(
        getCurrentFen(appModeState.moveHistory),
        moveSquares,
      );
    };

    const skipTurnAndProcessMove = (
      moveSquares: MoveSquares,
      promotion?: PieceType,
    ): void => {
      const historyAfterSkip = skipPlayerTurn(appModeState.moveHistory);
      const historyAfterSkipAndMove = processPlayerMove(
        moveSquares,
        historyAfterSkip,
        promotion,
      );
      if (historyAfterSkipAndMove !== null) {
        updateBoard(historyAfterSkipAndMove);
      } else {
        updateBoard(historyAfterSkip);
      }
    };

    const generatePgn = (winner: PlayerColour | null): Result<string> => {
      return chessEngine.generatePgn(
        appModeState.pairing.pgn,
        appModeState.moveHistory,
        winner,
      );
    };

    const toggleDraw = (drawIndex: number) => {
      setAppModeState(recordingState => {
        // Do nothing if we aren't in recording mode
        if (recordingState.mode !== AppMode.Recording) {
          return recordingState;
        }
        // Otherwise, update the last move
        return {
          ...recordingState,
          moveHistory: recordingState.moveHistory.map((el, index) =>
            index === drawIndex ? { ...el, drawOffer: !el.drawOffer } : el,
          ),
          undoStack: recordingState.undoStack.concat([
            {
              type: UndoActionType.ToggleDrawOffer,
              indexOfPlyInHistory: drawIndex,
            },
          ]),
        };
      });
    };

    const toggleRecordingMode = (): void => {
      setAppModeState({
        ...appModeState,
        type: appModeState.type === 'Graphical' ? 'Text' : 'Graphical',
      });
    };

    return [
      appModeState,
      {
        goToEndGame,
        goToTextInput,
        goToArbiterGameMode,
        move,
        undoLastAction,
        isPawnPromotion,
        skipTurn,
        isOtherPlayersPiece,
        skipTurnAndProcessMove,
        generatePgn,
        toggleDraw,
        toggleRecordingMode,
        goToEditMove,
      },
    ];
  };
