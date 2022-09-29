import React, { useContext } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { colours } from '../../style/colour';
import {
  BoardPosition,
  boardPositionToIndex,
  Position,
} from '../../types/ChessBoardPositions';
import { MoveSquares } from '../../types/ChessMove';
import { CHESS_SQUARE_SIZE } from '../ChessSquare/ChessSquare';
import ConditionalWrapper from '../ConditionalWrapper/ConditionalWrapper';
import DragAndDropContextProvider, {
  ClickToMoveContextProvider,
  useClickToMove,
} from '../DragAndDrop/DragAndDropContext/DragAndDropContext';
import Draggable from '../DragAndDrop/Draggable/Draggable';
import DropTarget from '../DragAndDrop/DropTarget/DropTarget';
import PieceAsset from '../PieceAsset/PieceAsset';
import RoundedView from '../RoundedView/RoundedView';
import { styles } from './style';

export type ChessBoardProps = {
  positions: BoardPosition[];
  flipBoard?: boolean;
  highlightedMove?: MoveSquares;
  onMove: (moveSquares: MoveSquares) => Promise<void>;
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
}) => {
  const squareColour = (position: Position) => {
    if (position === highlightedMove?.from) {
      return colours.lightGreen;
    }
    if (position === highlightedMove?.to) {
      return colours.lightOrange;
    }

    const [col, row] = boardPositionToIndex(position);
    return (col + row) % 2 === 0 ? colours.darkBlue : colours.lightBlue;
  };

  return (
    <ClickToMoveContextProvider>
      <DragAndDropContextProvider>
        <RoundedView style={styles.board}>
          {/* Pieces */}
          {positions.map((position, rowIdx) => {
            return (
              position.piece !== null && (
                <Draggable
                  data={position.position}
                  key={rowIdx}
                  onMove={onMove}
                  style={positionStyle(position.position, flipBoard ?? false)}>
                  <PieceAsset piece={position.piece} size={CHESS_SQUARE_SIZE} />
                </Draggable>
              )
            );
          })}
          {/* Board Squares */}
          {(!flipBoard ? reverseRowOrder(positions) : positions).map(
            (square, rowIndex) => {
              return (
                <ConditionalWrapper
                  condition={square.piece === null}
                  wrap={children => {
                    return (
                      <Clickable
                        onMove={onMove}
                        position={square.position}
                        key={square.position}>
                        {children}
                      </Clickable>
                    );
                  }}>
                  <DropTarget
                    onDrop={(data: unknown) =>
                      onMove({ from: data as Position, to: square.position })
                    }
                    key={rowIndex}
                    style={[
                      styles.boardSquare,
                      { backgroundColor: squareColour(square.position) },
                    ]}
                  />
                </ConditionalWrapper>
              );
            },
          )}
        </RoundedView>
      </DragAndDropContextProvider>
    </ClickToMoveContextProvider>
  );
};

export type clickableParams = {
  position: Position;
  onMove: (moveSquares: MoveSquares) => Promise<void>;
};
const Clickable: React.FC<clickableParams> = ({
  position,
  onMove,
  children,
}) => {
  const { registerSquare, getFromSquare } = useClickToMove(onMove);
  //console.log('FROM: ', getFromSquare());
  return (
    /*<ConditionalWrapper
      condition={position === getFromSquare()}
      wrap={children => {
        return (
          <View
            style={[
              styles.boardSquare,
              { backgroundColor: colours.lightGreen, zIndex: 5 },
            ]}>
            {children}
          </View>
        );
      }}>*/
    <TouchableOpacity
      style={{ zIndex: -1 }}
      onPress={() => registerSquare(position)}>
      {children}
    </TouchableOpacity>
    //</ConditionalWrapper>
  );
};
export default ChessBoard;
