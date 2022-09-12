import { chessEngine } from '../../chessEngine/chessEngineInterface';
import { RecordingMode } from '../../types/AppModeState';
import { UndoActionType, UndoAction } from '../../types/UndoAction';
import { getCurrentFen } from '../../util/moveHistory';

export const undoAction = (
  state: RecordingMode,
  action: UndoAction,
): RecordingMode => {
  switch (action.type) {
    case UndoActionType.ToggleDrawOffer: {
      return {
        ...state,
        moveHistory: state.moveHistory.map((el, index) =>
          index === action.indexOfPlyInHistory
            ? { ...el, drawOffer: !el.drawOffer }
            : el,
        ),
      };
    }
    case UndoActionType.EditTimeForMove: {
      return {
        ...state,
        moveHistory: state.moveHistory.map((el, index) =>
          index === action.indexOfPlyInHistory
            ? { ...el, gameTime: action.gameTime }
            : el,
        ),
      };
    }
    case UndoActionType.Move: {
      const moveHistory = state.moveHistory.filter(
        (_, index, arr) => index !== arr.length - 1,
      );
      const board = chessEngine.fenToBoardPositions(getCurrentFen(moveHistory));
      return {
        ...state,
        moveHistory,
        board,
      };
    }
    default: {
      console.log('Unimplemented undo action requested: ', action);
      return state;
    }
  }
};
