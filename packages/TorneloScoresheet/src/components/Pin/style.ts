import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root: { flex: 1, padding: 10, maxHeight: '10%' },
  codeFieldRoot: { marginTop: 20 },
  cell: {
    width: 50,
    height: 70,
    lineHeight: 38,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#00000030',
    textAlign: 'center',
  },
  focusCell: {
    borderColor: '#000',
  },

  verifyButtonArea: {
    marginTop: 100,
    flex: 0,
  },

  numbersInCells: {
    fontSize: 40,
    textAlign: 'center',
  },
});