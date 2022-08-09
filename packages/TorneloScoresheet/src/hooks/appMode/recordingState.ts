import { useContext } from 'react';
import { chessEngine } from '../../chessEngine/chessEngineInterface';
import {
  AppMode,
  AppModeState,
  RecordingMode as recordingMode,
} from '../../types/AppModeState';
import { ChessGameResult, PlayerColour } from '../../types/ChessGameInfo';
import {
  ChessPly,
  GameTime,
  MovePly,
  MoveSquares,
  PieceType,
  PlyTypes,
  SkipPly,
} from '../../types/ChessMove';
import { Result } from '../../types/Result';
import { storeRecordingModeData } from '../../util/storage';

type recordingStateHookType = [
  recordingMode,
  {
    goToEndGame: (result: ChessGameResult) => void;
    goToTextInput: () => void;
    goToArbiterGameMode: () => void;
    move: (moveSquares: MoveSquares, promotion?: PieceType) => void;
    undoLastMove: () => void;
    isPawnPromotion: (moveSquares: MoveSquares) => boolean;
    skipTurn: () => void;
    isOtherPlayersPiece: (move: MoveSquares) => boolean;
    skipTurnAndProcessMove: (move: MoveSquares, promotion?: PieceType) => void;
    generatePgn: (winner: PlayerColour | null) => Result<string>;
    toggleDraw: (drawIndex: number) => void;
    setGameTime: (index: number, gameTime: GameTime | undefined) => void;
    toggleRecordingMode: () => void;
  },
];

/**
 * Gets the current fen of the game based on move history
 * @param moveHistory array of ChessPly
 * @returns current fen
 */
const getCurrentFen = (moveHistory: ChessPly[]): string => {
  // no moves -> starting fen
  if (moveHistory.length === 0) {
    return chessEngine.startingFen();
  }

  // execute last ply to get resulting fen
  const lastPly = moveHistory[moveHistory.length - 1]!;

  // Last ply = SkipPly
  if (lastPly.type === PlyTypes.SkipPly) {
    return chessEngine.skipTurn(lastPly.startingFen);
  }

  // Last ply = MovePly
  return (
    chessEngine.makeMove(
      lastPly.startingFen,
      lastPly.move,
      lastPly.promotion,
    ) ?? '' // all move in history are legal, -> should never return undef
  );
};

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
  const nextPly: MovePly = {
    startingFen: getCurrentFen(moveHistory),
    move: moveSquares,
    type: PlyTypes.MovePly,
    moveNo: Math.floor(moveHistory.length / 2) + 1,
    player:
      moveHistory.length % 2 === 0 ? PlayerColour.White : PlayerColour.Black,
    promotion,
    drawOffer: false,
  };

  // return history array or null if move is not legal
  return chessEngine.makeMove(nextPly.startingFen, nextPly.move, promotion) ===
    null
    ? null
    : [...moveHistory, nextPly];
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
        mode: AppMode.ArbiterRecording,
        pairing: appModeState.pairing,
        moveHistory: appModeState.moveHistory,
        board: appModeState.board,
        startTime: appModeState.startTime,
        currentPlayer: appModeState.currentPlayer,
      });
    };

    const move = (moveSquares: MoveSquares, promotion?: PieceType): void => {
      const moveHistory = processPlayerMove(
        moveSquares,
        appModeState.moveHistory,
        promotion,
      );
      if (moveHistory !== null) {
        updateBoard(moveHistory);
      }
    };
    const isPawnPromotion = (moveSquares: MoveSquares): boolean => {
      const fen = getCurrentFen(appModeState.moveHistory);
      return chessEngine.isPawnPromotion(fen, moveSquares);
    };

    const undoLastMove = (): void => {
      updateBoard(appModeState.moveHistory.slice(0, -1));
    };

    const skipTurn = (): void => {
      updateBoard(skipPlayerTurn(appModeState.moveHistory));
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
        };
      });
    };

    const setGameTime = (index: number, gameTime: GameTime | undefined) => {
      setAppModeState(recordingState => {
        // Do nothing if we aren't in recording mode
        if (recordingState.mode !== AppMode.Recording) {
          return recordingState;
        }

        // Otherwise, set the game time of the desired move
        return {
          ...recordingState,
          moveHistory: recordingState.moveHistory.map((el, i) =>
            i === index ? { ...el, gameTime } : el,
          ),
        };
      });
    };

    const toggleRecordingMode = (): void => {
      setAppModeState({
        ...appModeState,
        type: appModeState.type === 'Recording' ? 'Text' : 'Recording',
      });
    };

    return [
      appModeState,
      {
        goToEndGame,
        goToTextInput,
        goToArbiterGameMode,
        move,
        undoLastMove,
        isPawnPromotion,
        skipTurn,
        isOtherPlayersPiece,
        skipTurnAndProcessMove,
        generatePgn,
        toggleDraw,
        setGameTime,
        toggleRecordingMode,
      },
    ];
  };
