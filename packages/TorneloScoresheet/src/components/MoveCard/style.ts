import { StyleSheet } from 'react-native';
import { colours } from '../../style/colour';

export const styles = StyleSheet.create({
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    borderColor: colours.grey,
    borderWidth: 2,
  },
  moveNumberArea: {
    backgroundColor: colours.primary,
  },
  whitePlyArea: {
    backgroundColor: colours.lightBlue,
  },
  blackPlyArea: {
    backgroundColor: colours.darkBlue,
  },
});
