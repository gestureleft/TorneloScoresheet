import React, { useState } from 'react';
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppModeState } from '../context/AppModeStateContext';
import { useError } from '../context/ErrorContext';
import { colours } from '../style/colour';
import { AppMode } from '../types/AppModeState';
import { isError } from '../types/Result';

const BLACK_LOGO_IMAGE = require('../../assets/images/icon-logo-black-500.png');

const EnterPgn: React.FC = () => {
  const [
    appModeState,
    { enterPgnToPairingSelection: goToTablePairingSelection },
  ] = useAppModeState();
  const [url, setUrl] = useState('');
  const [, showError] = useError();

  if (appModeState.mode !== AppMode.EnterPgn) {
    return <></>;
  }

  const handleNextClick = async () => {
    const result = await goToTablePairingSelection(url);

    if (isError(result)) {
      showError(result.error);
    }
  };

  return (
    <View style={styles.arbiterSetup}>
      <View style={styles.instructionBox}>
        <Image style={styles.image} source={BLACK_LOGO_IMAGE} />
        <Text style={styles.title}>Arbiter Mode</Text>
        <Text style={styles.instructions}>
          Go to tornelo.com to find the Live Broadcast PGN link. Then paste it
          below
        </Text>
        <TextInput
          style={styles.inputBox}
          onChangeText={setUrl}
          value={url}
          placeholder="Game Link"
        />
        <Text style={styles.submitBtn} onPress={handleNextClick}>
          Start {'>'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  arbiterSetup: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  instructionBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 100,
    marginRight: 100,
  },
  image: {
    width: 150,
    height: 155,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: colours.secondary,
    paddingTop: 70,
  },
  instructions: {
    fontSize: 25,
    color: colours.secondary,
    paddingTop: 70,
    alignSelf: 'flex-start',
  },
  inputBox: {
    fontSize: 25,
    color: colours.secondary,
    marginTop: 70,
    borderColor: colours.secondary,
    borderWidth: 1,
    width: 600,
  },
  submitBtn: {
    fontSize: 25,
    color: colours.secondary,
    marginTop: 50,
    fontWeight: 'bold',

    alignSelf: 'flex-start',
  },
});

export default EnterPgn;