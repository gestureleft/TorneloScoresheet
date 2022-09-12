import { RecordingMode } from '../../types/AppModeState';
import { UndoActionType, UndoAction } from '../../types/UndoAction';

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
    default: {
      console.log('Unimplemented undo action requested: ', action);
      return state;
    }
  }
};
