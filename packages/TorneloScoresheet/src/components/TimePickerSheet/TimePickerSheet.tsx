import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useEditTimeForMove } from '../../context/AppModeStateContext';
import { GameTime } from '../../types/ChessMove';
import PrimaryButton from '../PrimaryButton/PrimaryButton';
import Sheet from '../Sheet/Sheet';
import { styles } from './style';

export type TimePickerSheetProps = {
  dismiss: () => void;
  indexOfMoveBeingEdited: undefined | number;
};

const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  dismiss,
  indexOfMoveBeingEdited,
}) => {
  const { gameTime, editTimeForMove } = useEditTimeForMove(
    indexOfMoveBeingEdited,
  );

  const [date, setDate] = useState(() => {
    return new Date(1, 1, 1, gameTime?.hours, gameTime?.minutes, 0);
  });

  // refresh game time whenever it changes
  useEffect(() => {
    setDate(new Date(1, 1, 1, gameTime?.hours, gameTime?.minutes, 0));
  }, [gameTime]);

  const saveTime = (time: GameTime | undefined) => {
    if (indexOfMoveBeingEdited === undefined) {
      dismiss();
      return;
    }
    editTimeForMove(indexOfMoveBeingEdited, time);
    dismiss();
  };

  return (
    <Sheet
      dismiss={dismiss}
      visible={indexOfMoveBeingEdited !== undefined}
      title="Set move time">
      <View style={styles.container}>
        <DatePicker
          style={styles.timeBox}
          date={date}
          onDateChange={setDate}
          mode={'time'}
          locale={'fr'}
          is24hourSource={'locale'}
        />
        {indexOfMoveBeingEdited !== undefined && (
          <View style={styles.buttonContainer}>
            <PrimaryButton
              style={styles.buttons}
              label="remove"
              onPress={() => saveTime(undefined)}
            />
            <PrimaryButton
              label="confirm"
              style={styles.buttons}
              onPress={() => {
                saveTime({
                  hours: date.getHours(),
                  minutes: date.getMinutes(),
                });
              }}
            />
          </View>
        )}
      </View>
    </Sheet>
  );
};

export default TimePickerSheet;
