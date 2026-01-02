// chess.js types - will be loaded dynamically
type ChessType = any;

// Piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
  'p': 100,   // Pawn
  'n': 320,   // Knight
  'b': 330,   // Bishop
  'r': 500,   // Rook
  'q': 900,   // Queen
  'k': 20000  // King
};

// Piece-square tables for positional evaluation
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0,  0],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE_MIDDLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

const KING_TABLE_END = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

// Get position value from piece-square table
function getPositionValue(pieceType: string, color: string, rank: number, file: number, isEndgame: boolean): number {
  const isWhite = color === 'w';
  const r = isWhite ? rank : 7 - rank;
  const f = file;
  
  let value = 0;
  
  switch (pieceType) {
    case 'p':
      value = PAWN_TABLE[r][f];
      break;
    case 'n':
      value = KNIGHT_TABLE[r][f];
      break;
    case 'b':
      value = BISHOP_TABLE[r][f];
      break;
    case 'r':
      value = ROOK_TABLE[r][f];
      break;
    case 'q':
      value = QUEEN_TABLE[r][f];
      break;
    case 'k':
      value = isEndgame ? KING_TABLE_END[r][f] : KING_TABLE_MIDDLE[r][f];
      break;
    default:
      value = 0;
  }
  
  return isWhite ? value : -value;
}

// Check if position is endgame (few pieces remaining)
function isEndgame(game: ChessType): boolean {
  const board = game.board();
  let pieceCount = 0;
  let queenCount = 0;
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type !== 'k') {
        pieceCount++;
        if (piece.type === 'q') queenCount++;
      }
    }
  }
  
  return pieceCount <= 10 || queenCount === 0;
}

// Evaluate board position (positive = good for white, negative = good for black)
function evaluatePosition(game: ChessType): number {
  // Terminal states
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -1000000 : 1000000;
  }
  
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }
  
  const isEndgamePos = isEndgame(game);
  let score = 0;
  const board = game.board();
  
  // Material and position evaluation
  let whiteMaterial = 0;
  let blackMaterial = 0;
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        const positionValue = getPositionValue(piece.type, piece.color, i, j, isEndgamePos);
        
        if (piece.color === 'w') {
          whiteMaterial += value + positionValue;
        } else {
          blackMaterial += value + positionValue;
        }
      }
    }
  }
  
  score = whiteMaterial - blackMaterial;
  
  // Check penalty/bonus
  if (game.isCheck()) {
    score += game.turn() === 'w' ? -50 : 50;
  }
  
  // Mobility (number of legal moves)
  const currentMoves = game.moves({ verbose: true });
  score += currentMoves.length * (game.turn() === 'w' ? 2 : -2);
  
  // Pawn structure evaluation
  score += evaluatePawnStructure(game, 'w') - evaluatePawnStructure(game, 'b');
  
  // King safety
  score += evaluateKingSafety(game, 'w') - evaluateKingSafety(game, 'b');
  
  // Center control bonus
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  centerSquares.forEach(square => {
    const moves = game.moves({ square, verbose: true });
    score += moves.length * (game.turn() === 'w' ? 3 : -3);
  });
  
  return score;
}

// Evaluate pawn structure
function evaluatePawnStructure(game: ChessType, color: string): number {
  const board = game.board();
  let score = 0;
  const pawns: number[] = [];
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === 'p' && piece.color === color) {
        pawns.push(j);
      }
    }
  }
  
  // Doubled pawns penalty
  const fileCounts: { [key: number]: number } = {};
  pawns.forEach(file => {
    fileCounts[file] = (fileCounts[file] || 0) + 1;
  });
  
  Object.values(fileCounts).forEach(count => {
    if (count > 1) {
      score -= 20 * (count - 1);
    }
  });
  
  // Isolated pawns penalty
  pawns.forEach(file => {
    const hasNeighbor = pawns.some(p => Math.abs(p - file) === 1);
    if (!hasNeighbor) {
      score -= 15;
    }
  });
  
  // Passed pawns bonus
  pawns.forEach(file => {
    const rank = board.findIndex((row: any[]) => row[file]?.type === 'p' && row[file]?.color === color);
    if (rank !== -1) {
      const isWhite = color === 'w';
      let isPassed = true;
      for (let r = isWhite ? rank - 1 : rank + 1; isWhite ? r >= 0 : r < 8; isWhite ? r-- : r++) {
        for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
          const piece = board[r]?.[f];
          if (piece && piece.type === 'p' && piece.color !== color) {
            isPassed = false;
            break;
          }
        }
        if (!isPassed) break;
      }
      if (isPassed) {
        score += 30;
      }
    }
  });
  
  return score;
}

// Evaluate king safety
function evaluateKingSafety(game: ChessType, color: string): number {
  const board = game.board();
  let kingRank = -1;
  let kingFile = -1;
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === 'k' && piece.color === color) {
        kingRank = i;
        kingFile = j;
        break;
      }
    }
    if (kingRank !== -1) break;
  }
  
  if (kingRank === -1) return 0;
  
  let safety = 0;
  
  // Count pawns around king (pawn shield)
  const isWhite = color === 'w';
  const shieldRank = isWhite ? kingRank + 1 : kingRank - 1;
  if (shieldRank >= 0 && shieldRank < 8) {
    for (let f = Math.max(0, kingFile - 1); f <= Math.min(7, kingFile + 1); f++) {
      const piece = board[shieldRank]?.[f];
      if (piece && piece.type === 'p' && piece.color === color) {
        safety += 10;
      }
    }
  }
  
  return safety;
}

// Quiescence search - continue searching in tactical positions (with depth limit)
function quiescence(
  game: ChessType,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  qDepth: number = 0
): number {
  // Limit quiescence depth to prevent infinite recursion (reduced for speed)
  const MAX_QUIESCENCE_DEPTH = 3;
  if (qDepth >= MAX_QUIESCENCE_DEPTH) {
    return evaluatePosition(game);
  }
  
  const standPat = evaluatePosition(game);
  
  if (maximizingPlayer) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }
  
  // Only search captures and checks in quiescence
  const moves = game.moves({ verbose: true });
  const tacticalMoves = moves.filter((move: any) => {
    const isCapture = move.flags?.includes('c') || move.captured;
    const isCheck = game.isCheck();
    return isCapture || isCheck;
  });
  
  if (tacticalMoves.length === 0) {
    return standPat;
  }
  
  // Limit number of tactical moves to prevent explosion (reduced for speed)
  const MAX_TACTICAL_MOVES = 6;
  const limitedTacticalMoves = tacticalMoves.slice(0, MAX_TACTICAL_MOVES);
  
  // Sort captures by MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  limitedTacticalMoves.sort((a: any, b: any) => {
    const aValue = a.captured ? PIECE_VALUES[a.captured] : 0;
    const bValue = b.captured ? PIECE_VALUES[b.captured] : 0;
    return bValue - aValue;
  });
  
  if (maximizingPlayer) {
    let maxEval = standPat;
    for (const move of limitedTacticalMoves) {
      game.move(move);
      const score = quiescence(game, alpha, beta, false, qDepth + 1);
      game.undo();
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = standPat;
    for (const move of limitedTacticalMoves) {
      game.move(move);
      const score = quiescence(game, alpha, beta, true, qDepth + 1);
      game.undo();
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Minimax with alpha-beta pruning and quiescence search
function minimax(
  game: ChessType,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): number {
  // Terminal node or depth reached
  if (depth === 0 || game.isGameOver()) {
    return quiescence(game, alpha, beta, maximizingPlayer, 0);
  }
  
  const moves = game.moves({ verbose: true });
  
  if (moves.length === 0) {
    return evaluatePosition(game);
  }
  
  // Move ordering: prioritize captures, checks, and good moves
  const moveScores: Array<{ move: any; score: number }> = [];
  
  for (const move of moves) {
    let score = 0;
    
    // MVV-LVA for captures
    if (move.captured) {
      const victimValue = PIECE_VALUES[move.captured] || 0;
      const attackerValue = PIECE_VALUES[move.piece] || 0;
      score = 10000 + victimValue - attackerValue;
    }
    
    // Check bonus
    game.move(move);
    if (game.isCheck()) {
      score += 5000;
    }
    game.undo();
    
    // Promotion bonus
    if (move.promotion) {
      score += 8000;
    }
    
    moveScores.push({ move, score });
  }
  
  // Sort moves - best first
  moveScores.sort((a, b) => b.score - a.score);
  
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const { move } of moveScores) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const { move } of moveScores) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minEval;
  }
}

// Professional chess AI using minimax with alpha-beta pruning
export function getComputerMove(game: ChessType): { from: string; to: string; promotion?: string } | null {
  try {
    const moves = game.moves({ verbose: true });
    
    if (moves.length === 0) {
      return null; // No moves available
    }
    
    // If only one move, return it immediately
    if (moves.length === 1) {
      return {
        from: moves[0].from,
        to: moves[0].to,
        promotion: moves[0].promotion || 'q'
      };
    }
    
    const isMaximizing = game.turn() === 'w';
    let bestMove = moves[0];
    let bestEval = isMaximizing ? -Infinity : Infinity;
    
    // Dynamic depth based on position complexity - much deeper than before
    const moveCount = game.history().length;
    const numMoves = moves.length;
    const isEndgamePos = isEndgame(game);
    
    // Calculate optimal depth - optimized for speed while maintaining strength
    let depth = 4; // Base depth for strong play
    
    // Increase depth in simpler positions
    if (isEndgamePos && numMoves < 15) {
      depth = 5; // Deeper in simple endgame
    }
    
    if (numMoves < 10) {
      depth = 5; // Deeper when very few moves available
    }
    
    // Reduce for complex positions
    if (numMoves > 25) {
      depth = 3; // Faster in complex positions
    }
    
    console.log(`🤖 Pro AI analyzing ${numMoves} moves at depth ${depth}...`);
    
    // Evaluate moves with proper move ordering
    const moveScores: Array<{ move: any; score: number; isCapture: boolean; isCheck: boolean }> = [];
    
    for (const move of moves) {
      let priority = 0;
      
      // Quick evaluation
      game.move(move);
      const quickScore = evaluatePosition(game);
      const isCapture = move.flags?.includes('c') || move.captured;
      const isCheck = game.isCheck();
      game.undo();
      
      priority = quickScore;
      
      // Prioritize captures (MVV-LVA)
      if (isCapture && move.captured) {
        const victimValue = PIECE_VALUES[move.captured] || 0;
        const attackerValue = PIECE_VALUES[move.piece] || 0;
        priority += 10000 + victimValue - attackerValue;
      }
      
      // Prioritize checks
      if (isCheck) {
        priority += 5000;
      }
      
      // Prioritize promotions
      if (move.promotion) {
        priority += 8000;
      }
      
      moveScores.push({ move, score: priority, isCapture, isCheck });
    }
    
    // Sort moves - best first
    moveScores.sort((a, b) => isMaximizing ? (b.score - a.score) : (a.score - b.score));
    
    // Limit moves evaluated for performance - more aggressive limiting
    const MAX_MOVES_TO_EVALUATE = numMoves > 20 ? 12 : (numMoves > 15 ? 15 : numMoves);
    const movesToEvaluate = moveScores.slice(0, MAX_MOVES_TO_EVALUATE);
    
    console.log(`   Evaluating top ${movesToEvaluate.length} moves with deep minimax...`);
    
    let evaluatedCount = 0;
    for (const { move } of movesToEvaluate) {
      evaluatedCount++;
      if (evaluatedCount % 3 === 0) {
        console.log(`   ...evaluated ${evaluatedCount}/${movesToEvaluate.length} moves...`);
      }
      
      game.move(move);
      const score = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
      game.undo();
      
      if (isMaximizing) {
        if (score > bestEval) {
          bestEval = score;
          bestMove = move;
        }
        // Early termination for checkmate
        if (score > 500000) {
          console.log(`   ✅ Found checkmate!`);
          break;
        }
      } else {
        if (score < bestEval) {
          bestEval = score;
          bestMove = move;
        }
        // Early termination for checkmate
        if (score < -500000) {
          console.log(`   ✅ Found checkmate!`);
          break;
        }
      }
    }
    
    console.log(`✅ Pro AI selected best move with evaluation: ${bestEval.toFixed(2)}`);
    
    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q'
    };
  } catch (error) {
    console.error("Error getting computer move:", error);
    // Fallback to best heuristic move if minimax fails
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Find best capture or check
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      let score = 0;
      if (move.captured) {
        score += PIECE_VALUES[move.captured] || 0;
      }
      game.move(move);
      if (game.isCheck()) score += 50;
      game.undo();
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q'
    };
  }
}

// Get computer user ID (create if doesn't exist)
export async function getComputerUserId(prisma: any): Promise<string> {
  // Check if computer user exists
  let computerUser = await prisma.user.findUnique({
    where: { email: 'computer@chess-ai.local' }
  });
  
  if (!computerUser) {
    // Create computer user
    computerUser = await prisma.user.create({
      data: {
        name: 'Chess AI',
        email: 'computer@chess-ai.local',
        passwordHash: '', // Empty string instead of null
        kycVerified: false,
      }
    });
    
    // Create wallet for computer (not needed but keeps schema consistent)
    await prisma.wallet.create({
      data: {
        userId: computerUser.id,
        balance: 0,
        lockedBalance: 0,
      }
    });
  }
  
  return computerUser.id;
}
