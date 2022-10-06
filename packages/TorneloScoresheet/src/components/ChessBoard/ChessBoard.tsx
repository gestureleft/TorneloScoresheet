import React, { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { colours, ColourType } from '../../style/colour';
import {
  BoardPosition,
  boardPositionToIndex,
  Position,
} from '../../types/ChessBoardPositions';
import { MoveSquares } from '../../types/ChessMove';
import { CHESS_SQUARE_SIZE } from '../ChessSquare/ChessSquare';
import DragAndDropContextProvider from '../DragAndDrop/DragAndDropContext/DragAndDropContext';
import Draggable from '../DragAndDrop/Draggable/Draggable';
import DropTarget from '../DragAndDrop/DropTarget/DropTarget';
import PieceAsset from '../PieceAsset/PieceAsset';
import RoundedView from '../RoundedView/RoundedView';
import { styles } from './style';

type HighlightedPosition = {
  position: Position;
  colour: ColourType;
};

export type ChessBoardProps = {
  positions: BoardPosition[];
  flipBoard?: boolean;
  highlightedMove?: HighlightedPosition[];
  onMove: (moveSquares: MoveSquares) => Promise<void>;
  onPositionPressed?: (position: Position) => void;
};

const positionStyle = (position: Position, flipBoard: boolean) => {
  const [col, row] = boardPositionToIndex(position);

  return {
    position: 'absolute' as const,
    zIndex: 2,
    left: (flipBoard ? col : col) * CHESS_SQUARE_SIZE,
    top: (flipBoard ? row : 7 - row) * CHESS_SQUARE_SIZE,
  };
};

/**
 * Will reverse the row order
 * @param board The board postions
 * @returns the board positions in reversed order
 */
const reverseRowOrder = (board: BoardPosition[]) => {
  return (
    board
      // turn the array of length 64 into and 8x8
      .reduce<BoardPosition[][]>((resultArray, item, index) => {
        const rowIndex = Math.floor(index / 8);

        // new row
        if (!resultArray[rowIndex]) {
          resultArray[rowIndex] = [];
        }

        // same row
        resultArray[rowIndex]!.push(item);

        return resultArray;
      }, [])
      // reverse the rows
      .reverse()
      // transform back to flat array of length 64
      .flatMap(row => row)
  );
};

const ChessBoard: React.FC<ChessBoardProps> = ({
  positions,
  flipBoard,
  highlightedMove,
  onMove,
  onPositionPressed,
}) => {
  const boardPositionLookupTable: {
    [key: string]: ColourType;
  } = useMemo(() => {
    return (
      highlightedMove?.reduce(
        (acc, el) => {
          acc[el.position] = el.colour;
          return acc;
        },
        {} as {
          [key: string]: ColourType;
        },
      ) ?? {}
    );
  }, [highlightedMove]);

  const squareColour = (position: Position) => {
    const squareColour = boardPositionLookupTable[position];

    if (squareColour) {
      return squareColour;
    }

    const [col, row] = boardPositionToIndex(position);
    return (col + row) % 2 === 0 ? colours.darkBlue : colours.lightBlue;
  };

  return (
    <DragAndDropContextProvider>
      <RoundedView style={styles.board}>
        {/* Pieces */}
        {positions.map((position, rowIdx) => {
          return (
            position.piece !== null && (
              <TouchableOpacity
                onPress={() => onPositionPressed?.(position.position)}
                activeOpacity={0.8}
                key={rowIdx}>
                <Draggable
                  data={position.position}
                  onMove={onMove}
                  style={positionStyle(position.position, flipBoard ?? false)}>
                  <PieceAsset piece={position.piece} size={CHESS_SQUARE_SIZE} />
                </Draggable>
              </TouchableOpacity>
            )
          );
        })}
        {/* Board Squares */}
        {(!flipBoard ? reverseRowOrder(positions) : positions).map(
          (square, rowIndex) => {
            return (
              <TouchableOpacity
                key={rowIndex}
                activeOpacity={0.8}
                style={{ zIndex: -2 }}
                onPress={() => onPositionPressed?.(square.position)}>
                <DropTarget
                  onDrop={(data: unknown) =>
                    onMove({ from: data as Position, to: square.position })
                  }
                  style={[
                    styles.boardSquare,
                    { backgroundColor: squareColour(square.position) },
                  ]}
                />
              </TouchableOpacity>
            );
          },
        )}
      </RoundedView>
    </DragAndDropContextProvider>
  );
};

export default ChessBoard;
