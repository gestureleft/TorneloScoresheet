import { Chess, Color, Piece as EnginePiece, PieceSymbol } from 'chess.ts';
import moment from 'moment';
import {
  boardIndexToPosition,
  BoardPosition,
  ChessBoardPositions,
} from '../types/ChessBoardPositions';
import {
  ChessGameInfo,
  Player,
  PlayerColour,
  PLAYER_COLOUR_NAME,
} from '../types/ChessGameInfo';
import { Piece, PieceType, PlySquares } from '../types/ChessMove';
import { Result, succ, fail, isError } from '../types/Result';
import { ChessEngineInterface } from './chessEngineInterface';

const PARSING_FAILURE = fail(
  'Invalid PGN returned from website. Please double check the link',
);

// ------- Public interface
/**
 * Extracts game info from a pgn string (using headers) will return undefined if error occurs when parsing.
 * @param pgn pgn string of the game to be parsed
 * @returns All info of game from headers
 */
const parseGameInfo = (pgn: string): Result<ChessGameInfo> => {
  // create game object to parse pgn
  let game = new Chess();

  try {
    // parse pgn
    if (!game.loadPgn(pgn)) {
      return PARSING_FAILURE;
    }

    // extract rounds
    const rounds = parseRoundInfo(game.header().Round);
    if (isError(rounds)) {
      return rounds;
    }
    const [board, round, gameNo] = rounds.data;

    // extract players
    const whitePlayerOrError = extractPlayer(PlayerColour.White, game.header());
    if (isError(whitePlayerOrError)) {
      return whitePlayerOrError;
    }
    const whitePlayer = whitePlayerOrError.data;

    const blackPlayerOrError = extractPlayer(PlayerColour.Black, game.header());
    if (isError(blackPlayerOrError)) {
      return blackPlayerOrError;
    }
    const blackPlayer = blackPlayerOrError.data;

    return succ({
      name: game.header().Event ?? '',
      date: moment(game.header().Date ?? '', 'YYYY.MM.DD'),
      site: game.header().Site ?? '',
      round: round,
      board: board,
      game: gameNo,
      result: game.header().Result ?? '',
      players: [whitePlayer, blackPlayer],
      pgn: pgn,
    });
  } catch (error) {
    return PARSING_FAILURE;
  }
};

/**
 * Starts a new game and returns starting fen and board positions
 * @returns [Board positions, starting fen]
 */
const startGame = (): [ChessBoardPositions, string] => {
  const game = new Chess();
  return [gameToPeiceArray(game), game.fen()];
};

/**
 * Returns the board postion state given a fen
 * @param fen the current state of the board
 * @returns the board postions of the chess board
 */
const fenToBoardPositions = (fen: string): ChessBoardPositions => {
  const game = new Chess(fen);
  return gameToPeiceArray(game);
};

/**
 * Processes a move given the starting fen and to and from positions
 * @param startingFen the fen of the game state before the move
 * @param plie the to and from positions of the move
 * @returns the next fen if move is possible else null
 */
const makeMove = (
  startingFen: string,
  plySquares: PlySquares,
): string | null => {
  const game = new Chess(startingFen);
  const result = game.force_move({ from: plySquares.from, to: plySquares.to });
  if (result === null) {
    return null;
  }

  return game.fen();
};

/**
 * The exported chess engine object which implements all the public methods
 */
export const chessTsChessEngine: ChessEngineInterface = {
  parseGameInfo,
  startGame,
  makeMove,
  fenToBoardPositions,
};

// ------- Privates

/**
 * Returns the board state in a nested array
 * @param game The game Object
 * @returns a nested array of board postitions
 */
const gameToPeiceArray = (game: Chess): ChessBoardPositions => {
  const board = [...game.board()]
    .reverse()
    .map((gameRow, colIdx) =>
      gameRow.map((peice, rowIdx) => getBoardPosition(peice, colIdx, rowIdx)),
    );

  // cast is safe beause chess.ts is well tested, board at this point will always be an 8 X 8 array
  return board as ChessBoardPositions;
};

/**
 * Maps a peice and position index to a BoardPosition
 * @param piece the chess.ts piece at this postion
 * @param colIdx the column of this position
 * @param rowIdx the row of this position
 * @returns BoardPosition object
 */
const getBoardPosition = (
  piece: EnginePiece | null,
  colIdx: number,
  rowIdx: number,
): BoardPosition => {
  return {
    piece: piece === null ? null : mapEnginePeice(piece),
    position: boardIndexToPosition(rowIdx, colIdx),
  };
};

/**
 * Maps chess.js Peice to tornelo peice
 * @param peice the chess.js peice object
 * @returns tornelo peice
 */
const mapEnginePeice = (peice: EnginePiece): Piece => {
  return {
    player: colorMap[peice.color],
    type: pieceMap[peice.type],
  };
};

const pieceMap: Record<PieceSymbol, PieceType> = {
  p: PieceType.Pawn,
  r: PieceType.Rook,
  b: PieceType.Bishop,
  k: PieceType.King,
  q: PieceType.Queen,
  n: PieceType.Knight,
};
const colorMap: Record<Color, PlayerColour> = {
  w: PlayerColour.White,
  b: PlayerColour.Black,
};

const extractPlayer = (
  color: PlayerColour,
  headers: Record<string, string>,
): Result<Player> => {
  let playerColorName = PLAYER_COLOUR_NAME[color];

  // get player names
  const names = parsePlayerName(headers[playerColorName] ?? '');
  if (isError(names)) {
    return names;
  }
  const [firstName, lastName] = names.data;

  // get player fide id
  const parsedFideId = parseInt(headers[`${playerColorName}FideId`] ?? '', 10);
  const fideId = isNaN(parsedFideId) ? undefined : parsedFideId;

  return succ({
    firstName,
    lastName,
    color,
    fideId,
    elo: 0,
    // TODO: When the tornelo server starts returning the country, return it
    country: '',
  });
};

const parsePlayerName = (name: string): Result<[string, string]> => {
  // parse first and last names
  let nameRegexResult = name.match(/(.+)[,]{1}(.+)/);

  if (nameRegexResult === null) {
    return fail("PGN game didn't have any names");
  }
  if (nameRegexResult.length !== 3) {
    return fail("PGN game didn't have any names");
  }

  // return firstname, lastname
  return succ([nameRegexResult[2], nameRegexResult[1]]);
};

/**
 * @param round round text
 * @returns <board, round, game>
 */
export const parseRoundInfo = (
  round: string,
): Result<[number, number?, number?]> => {
  const ROUND_FAILURE = fail('Error parsing PGN round');
  // parse round and subround
  const roundRegex = /(?<one>[0-9]+)[.]?(?<two>[0-9]*)[.]?(?<three>[0-9]*)/;
  let regexResults = roundRegex.exec(round);
  if (regexResults === null || !regexResults.groups) {
    return ROUND_FAILURE;
  }

  // get
  let one = parseInt(regexResults.groups.one, 10);
  let two = parseInt(regexResults.groups.two, 10);
  let three = parseInt(regexResults.groups.three, 10);

  // format: ''.0.1 -> failure
  if (isNaN(one)) {
    return ROUND_FAILURE;
  }

  // format: 1 -> board: 1, round: undef, game: undef
  if (isNaN(two) && isNaN(three)) {
    return succ([one]);
  }

  // format: 1.2 -> board: 2, round: 1, game: undef
  if (isNaN(three)) {
    return succ([two, one]);
  }

  // format: 1.2.3 -> board: 3, round: 1, game: 2
  return succ([three, one, two]);
};
