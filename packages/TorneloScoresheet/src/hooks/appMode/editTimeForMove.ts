import { useCallback, useContext, useMemo } from 'react';
import { RecordingMode, AppModeState, AppMode } from '../../types/AppModeState';
import { GameTime } from '../../types/ChessMove';
import { UndoActionType } from '../../types/UndoAction';

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

/**
 * Convenience utilities for making an edit to a given move
 */
export const makeEditTimeForMove =
  (
    context: React.Context<
      [AppModeState, React.Dispatch<React.SetStateAction<AppModeState>>]
    >,
  ) =>
  (indexOfMoveBeingEdited: number | undefined) => {
    const [state, setAppModeState] = useContext(context);

    const gameTime = useMemo(() => {
      if (state.mode !== AppMode.Recording) {
        return undefined;
      }
      if (indexOfMoveBeingEdited === undefined || state === undefined) {
        return undefined;
      }
      return (
        state.moveHistory.filter(
          (_, index) => index === indexOfMoveBeingEdited,
        )?.[0]?.gameTime ?? getCurrentGameTime(state)
      );
    }, [indexOfMoveBeingEdited, state]);

    const editTimeForMove = useCallback(
      (index: number, newGameTime: GameTime | undefined) => {
        setAppModeState(recordingState => {
          // Do nothing if we aren't in recording mode
          if (recordingState.mode !== AppMode.Recording) {
            return recordingState;
          }

          const currentGameTime = recordingState.moveHistory[index]?.gameTime;

          // Otherwise, set the game time of the desired move
          return {
            ...recordingState,
            moveHistory: recordingState.moveHistory.map((el, i) =>
              i === index ? { ...el, gameTime: newGameTime } : el,
            ),
            undoStack: recordingState.undoStack.concat([
              {
                type: UndoActionType.EditTimeForMove,
                indexOfPlyInHistory: index,
                gameTime: currentGameTime,
              },
            ]),
          };
        });
      },
      [setAppModeState],
    );

    return {
      // The gameTime saved on the move at `indexOfMoveBeingEdited`, or the amount of time
      // since the game started if that doesn't exist
      gameTime,
      editTimeForMove,
    };
  };
