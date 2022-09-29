import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { measure, pointIsWithinView } from '../../../util/measure';
import { Position } from '../../../types/ChessBoardPositions';
import { isGenericTypeAnnotation } from '@babel/types';
import { MoveSquares } from '../../../types/ChessMove';

type DragAndDropContextState = {
  dropTargetRefs: [React.RefObject<View>, (data: unknown) => Promise<void>][];
};

const DragAndDropContext = React.createContext<
  [
    DragAndDropContextState,
    React.Dispatch<React.SetStateAction<DragAndDropContextState>>,
  ]
>([
  {
    dropTargetRefs: [],
  },
  () => undefined,
]);

// To become a drop target, a component should call this function
export const useDropTarget = (
  ref: React.RefObject<View>,
  callback: (data: unknown) => Promise<void>,
) => {
  const [, setDropTargetRefs] = useContext(DragAndDropContext);

  useEffect(() => {
    setDropTargetRefs(currentVal => ({
      dropTargetRefs: currentVal.dropTargetRefs.concat([[ref, callback]]),
    }));
    return () => {
      setDropTargetRefs(currentVal => ({
        dropTargetRefs: currentVal.dropTargetRefs.filter(r => r[0] !== ref),
      }));
    };
  }, [callback, ref, setDropTargetRefs]);
};

// Hook to get a hit test function for the current drag and drop context
export const useHitTest = (
  draggable: React.RefObject<View>,
  data: unknown,
  onMiss: () => void,
) => {
  const [dropTargets] = useContext(DragAndDropContext);
  return async (): Promise<void> => {
    if (!draggable.current) {
      return;
    }
    const {
      width: draggableWidth,
      height: draggableHeight,
      pageX: draggablePageX,
      pageY: draggablePageY,
    } = await measure(draggable.current);

    const draggableCenter = {
      x: draggablePageX + 0.5 * draggableWidth,
      y: draggablePageY + 0.5 * draggableHeight,
    };

    const hitTestResults = await Promise.all(
      dropTargets.dropTargetRefs
        .filter(([dropTargetRef]) => dropTargetRef.current)
        .map(async ([dropTargetRef, callback]) => ({
          didHit: await pointIsWithinView(
            draggableCenter,
            // The filter call above ensures that this isn't null
            // unfortunately typescript isn't smart enough to realise this
            dropTargetRef.current!,
          ),
          callback,
        })),
    );

    // We only want a single drop target to be hit, so we take the first one
    const targetDroppedOn = hitTestResults.find(el => el.didHit);

    if (!targetDroppedOn) {
      onMiss();
      return;
    }

    await targetDroppedOn.callback(data);
    onMiss();
  };
};

type ClickToMoveContextState = {
  fromSquare: unknown | null;
  toSquare: unknown | null;
};
const ClickToMoveContext = React.createContext<
  [
    ClickToMoveContextState,
    React.Dispatch<React.SetStateAction<ClickToMoveContextState>>,
  ]
>([{ fromSquare: null, toSquare: null }, () => undefined]);

type clickToMoveHook = {
  registerSquare: (postiion: Position | null) => void;
  getFromSquare: () => Position | unknown | null;
};

export const useClickToMove = (
  onMove: (moveSquares: MoveSquares) => Promise<void>,
): clickToMoveHook => {
  const [clickToMoveState, setClickToMoveState] =
    useContext(ClickToMoveContext);

  const registerSquare = (position: Position | null) => {
    if (clickToMoveState.fromSquare === null) {
      console.log('registering from square: ' + position);
      setClickToMoveState({ ...clickToMoveState, fromSquare: position });
    } else {
      setClickToMoveState({ ...clickToMoveState, toSquare: position });
      console.log('registered to squre: ' + position);
      if (clickToMoveState.fromSquare !== position) {
        //attempt to move
        onMove({
          from: clickToMoveState.fromSquare as Position,
          to: position as Position,
        });
      }
      setClickToMoveState({ fromSquare: null, toSquare: null });
    }
  };

  const getFromSquare = (): Position | unknown | null => {
    const from = clickToMoveState.fromSquare;
    return from;
  };

  return { registerSquare, getFromSquare };
};

export const ClickToMoveContextProvider: React.FC = ({ children }) => {
  const dragAndDropState = useState<ClickToMoveContextState>({
    fromSquare: null,
    toSquare: null,
  });

  return (
    <ClickToMoveContext.Provider value={dragAndDropState}>
      <View>{children}</View>
    </ClickToMoveContext.Provider>
  );
};

const DragAndDropContextProvider: React.FC = ({ children }) => {
  const dragAndDropState = useState<DragAndDropContextState>({
    dropTargetRefs: [],
  });

  return (
    <DragAndDropContext.Provider value={dragAndDropState}>
      <View>{children}</View>
    </DragAndDropContext.Provider>
  );
};

export default DragAndDropContextProvider;
