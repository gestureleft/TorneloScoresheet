import React from 'react';
import { ChessMove } from '../../types/ChessMove';
import RoundedView from '../RoundedView/RoundedView';
import { styles } from './style';

type MoveCardProps = {
  move: ChessMove;
};

const MoveCard: React.FC<MoveCardProps> = ({ move }) => {
  return (
    <RoundedView style={styles.cardContainer}># {move.moveNo}</RoundedView>
  );
};

export default MoveCard;
