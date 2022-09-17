import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ChessBoard from '../../components/ChessBoard/ChessBoard';
import MoveCard from '../../components/MoveCard/MoveCard';
import { useRecordingState } from '../../context/AppModeStateContext';
import { PlayerColour } from '../../types/ChessGameInfo';
import { PieceType, MoveSquares, GameTime } from '../../types/ChessMove';
import { styles } from './style';
import MoveOptionsSheet, { EditingMove } from './MoveOptionsSheet';
import GraphicalModePlayerCard from '../../components/GraphicalModePlayerCard/GraphicalModePlayerCard';
import TimePickerSheet from '../../components/TimePickerSheet/TimePickerSheet';
import Actions from './Actions';
import PromotionSheet from './PromotionSheet';
import EndGameSheet from './EndGameSheet';
import { RecordingMode } from '../../types/AppModeState';
import { isError } from '../../types/Result';
import { useError } from '../../context/ErrorContext';
import { plysToMoves } from '../../util/moves';
import { useUndo } from '../../hooks/useUndo';
import { ReversibleActionType } from '../../types/ReversibleAction';

const GraphicalRecording: React.FC = () => {
  const { undo, redo, pushUndoAction } = useUndo();
  // app mode hook unpacking
  const recordingState = useRecordingState();
  const recordingMode = recordingState?.state;
  const makeMove = recordingState?.move;
  const isPawnPromotion = recordingState?.isPawnPromotion;
  const setGameTime = recordingState?.setGameTime;
  const isOtherPlayersPiece = recordingState?.isOtherPlayersPiece;
  const skipTurnAndProcessMove = recordingState?.skipTurnAndProcessMove;

  // states
  const [flipBoard, setFlipBoard] = useState(
    recordingMode?.currentPlayer === PlayerColour.Black,
  );
  const [showPromotion, setShowPromotion] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);
  const [moveGameTimeIndex, setMoveGameTimeIndex] = useState<
    number | undefined
  >(undefined);
  const moveGameTime = useMemo(() => {
    if (!recordingMode || moveGameTimeIndex === undefined) {
      return { hours: 0, minutes: 0 };
    }
    const gameTime = recordingMode.moveHistory[moveGameTimeIndex]?.gameTime;

    // return gameTime associated with move if it exists else current game time
    return gameTime ? gameTime : getCurrentGameTime(recordingMode);
  }, [recordingMode, moveGameTimeIndex]);
  const [, showError] = useError();

  // Scroll view ref
  const scrollRef = useRef<ScrollView>(null);

  // when the promotion popup opens, the app will await untill a promise is resolved
  // this ref stores this resolve function (it will be called once the user selects a promotion)
  const resolvePromotion = useRef<
    ((value: PieceType | PromiseLike<PieceType>) => void) | null
  >(null);

  // Button Functions
  /**
   * this will prompt user to select a promotion piece and will not return until they do
   */
  const promptUserForPromotionChoice = (): Promise<PieceType> => {
    // prompt user to select promotion
    setShowPromotion(true);

    // create a promise, store the resolve function in the ref
    // this promise will not return until the resolve function is called by handleSelectPromotion()
    return new Promise<PieceType>(r => (resolvePromotion.current = r));
  };

  const handleMove = async (moveSquares: MoveSquares): Promise<void> => {
    if (
      !makeMove ||
      !isPawnPromotion ||
      !isOtherPlayersPiece ||
      !skipTurnAndProcessMove
    ) {
      return;
    }

    // check for promotion
    let promotion: PieceType | undefined;
    if (isPawnPromotion(moveSquares)) {
      // prompt user to select piece and wait until they do
      promotion = await promptUserForPromotionChoice();
    }

    pushUndoAction({ type: ReversibleActionType.Move, moveSquares, promotion });
    // If the user is moving the piece of the player who's turn it ISN'T,
    // automatically insert a skip for them
    const moveFunction = isOtherPlayersPiece(moveSquares)
      ? skipTurnAndProcessMove
      : makeMove;

    const resultOfMove = moveFunction(moveSquares, promotion);
    if (isError(resultOfMove)) {
      showError(resultOfMove.error);
      return;
    }
  };

  const [editingMove, setEditingMove] = useState<undefined | EditingMove>(
    undefined,
  );

  const handleRequestEditMove = (colour: PlayerColour, moveIndex: number) =>
    setEditingMove({ colour, moveIndex });

  const handleDismissMoveOptions = () => setEditingMove(undefined);

  const showSelectGameTimeSheet = (index: number): void => {
    // store index, set the current game time for that move, then show sheet
    setMoveGameTimeIndex(index);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd();
  }, [recordingMode?.moveHistory]);

  return (
    <>
      {recordingMode && (
        <View style={styles.mainContainer}>
          {/*----- Popups -----*/}
          <PromotionSheet
            show={showPromotion}
            dismiss={() => setShowPromotion(false)}
            makeSelection={promotion => {
              // call the promise's resolve function
              // this will end the await and result in the move being executed
              resolvePromotion.current && resolvePromotion.current(promotion);
            }}
          />
          <EndGameSheet
            show={showEndGame}
            dismiss={() => setShowEndGame(false)}
          />
          <MoveOptionsSheet
            pushUndoAction={pushUndoAction}
            editingMove={editingMove}
            handleGameTime={showSelectGameTimeSheet}
            dismiss={handleDismissMoveOptions}
          />
          <TimePickerSheet
            dismiss={() => setMoveGameTimeIndex(undefined)}
            visible={moveGameTimeIndex !== undefined}
            gameTime={moveGameTime}
            setGameTime={(gameTime: GameTime | undefined) => {
              if (setGameTime && moveGameTimeIndex !== undefined) {
                pushUndoAction({
                  type: ReversibleActionType.EditTimeForMove,
                  indexOfPlyInHistory: moveGameTimeIndex,
                  previousGameTime:
                    recordingMode?.moveHistory[moveGameTimeIndex]?.gameTime,
                });
                setGameTime(moveGameTimeIndex, gameTime);
              }
              setMoveGameTimeIndex(undefined);
            }}
          />
          {/*----- body ----- */}
          <View style={styles.playerCardsContainer}>
            <GraphicalModePlayerCard
              align="left"
              player={recordingMode.pairing.players[0]}
            />
            <View style={styles.verticalSeparator} />
            <GraphicalModePlayerCard
              align="right"
              player={recordingMode.pairing.players[1]}
            />
          </View>

          <View style={styles.boardButtonContainer}>
            <Actions
              pushUndoAction={pushUndoAction}
              undo={undo}
              redo={redo}
              flipBoard={() => setFlipBoard(v => !v)}
              recordTime={() =>
                recordingState &&
                showSelectGameTimeSheet(recordingMode.moveHistory.length - 1)
              }
              endGame={() => setShowEndGame(true)}
            />
            <ChessBoard
              positions={recordingMode.board}
              onMove={handleMove}
              flipBoard={flipBoard}
            />
          </View>
          <ScrollView
            ref={scrollRef}
            horizontal
            style={styles.moveCardContainer}>
            {plysToMoves(recordingMode.moveHistory).map((move, index) => (
              <MoveCard
                key={index}
                move={move}
                onRequestEditMove={colour =>
                  handleRequestEditMove(colour, index)
                }
              />
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

/**
 * Calculates the game time since the game started
 * @returns the game time
 */
const getCurrentGameTime = (currentState: RecordingMode): GameTime => {
  const totalMiliseconds = new Date().getTime() - currentState.startTime;
  const totalMinutes = totalMiliseconds / (1000 * 60);

  // calculate time since start
  return {
    hours: totalMinutes / 60,
    minutes: totalMinutes % 60,
  };
};

export default GraphicalRecording;
