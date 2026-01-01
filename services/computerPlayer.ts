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

// Evaluate board position (positive = good for white, negative = good for black)
function evaluatePosition(game: ChessType): number {
  // Terminal states
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -100000 : 100000; // Checkmate
  }
  
  if (game.isDraw() || game.isStalemate()) {
    return 0; // Draw
  }
  
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
        const positionValue = getPositionValue(piece.type, piece.color, i, j);
        
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
    score += game.turn() === 'w' ? -30 : 30;
  }
  
  // Mobility (number of legal moves) - more moves = better position
  const currentMoves = game.moves({ verbose: true });
  score += currentMoves.length * (game.turn() === 'w' ? 1 : -1);
  
  // Pawn structure evaluation
  score += evaluatePawnStructure(game, 'w') - evaluatePawnStructure(game, 'b');
  
  // King safety
  score += evaluateKingSafety(game, 'w') - evaluateKingSafety(game, 'b');
  
  return score;
}

// Evaluate pawn structure
function evaluatePawnStructure(game: ChessType, color: string): number {
  const board = game.board();
  let score = 0;
  const pawns: number[] = [];
  
  // Count pawns on each file
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === 'p' && piece.color === color) {
        pawns.push(j); // File number
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
      score -= 20 * (count - 1); // Penalty for doubled pawns
    }
  });
  
  // Isolated pawns penalty
  pawns.forEach(file => {
    const hasNeighbor = pawns.some(p => Math.abs(p - file) === 1);
    if (!hasNeighbor) {
      score -= 15; // Isolated pawn penalty
    }
  });
  
  return score;
}

// Evaluate king safety
function evaluateKingSafety(game: ChessType, color: string): number {
  const board = game.board();
  let kingRank = -1;
  let kingFile = -1;
  
  // Find king position
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
  
  // King in center is less safe in opening/middlegame
  if (kingFile >= 3 && kingFile <= 4 && kingRank >= 3 && kingRank <= 4) {
    safety -= 20;
  }
  
  // King on back rank is safer
  const isWhite = color === 'w';
  if ((isWhite && kingRank === 0) || (!isWhite && kingRank === 7)) {
    safety += 10;
  }
  
  return safety;
}

// Piece-square tables for better positional play
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

const KING_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// Position values for pieces using piece-square tables
function getPositionValue(pieceType: string, color: string, rank: number, file: number): number {
  const isWhite = color === 'w';
  const r = isWhite ? rank : 7 - rank; // Flip for black
  const f = file;
  
  let value = 0;
  
  switch (pieceType) {
    case 'p': // Pawn
      value = PAWN_TABLE[r][f];
      break;
    case 'n': // Knight
      value = KNIGHT_TABLE[r][f];
      break;
    case 'b': // Bishop
      value = BISHOP_TABLE[r][f];
      break;
    case 'r': // Rook
      value = ROOK_TABLE[r][f];
      break;
    case 'q': // Queen
      value = QUEEN_TABLE[r][f];
      break;
    case 'k': // King
      value = KING_TABLE[r][f];
      break;
    default:
      value = 0;
  }
  
  return isWhite ? value : -value;
}

// Minimax with alpha-beta pruning
function minimax(
  game: ChessType,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): number {
  // Base case: evaluate position or terminal state
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game);
  }
  
  const moves = game.moves({ verbose: true });
  
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
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
    
    // Optimized depth based on game phase - prioritize speed
    const moveCount = game.history().length;
    let depth = 2; // Start with depth 2 for fast response
    
    // Increase depth only in simple endgame positions
    if (moveCount > 30 && moves.length < 15) {
      depth = 3; // Slightly deeper in simple endgame
    }
    
    // Reduce depth for complex positions
    if (moves.length > 25) {
      depth = 2; // Keep shallow for complex positions
    }
    
    if (moves.length > 35) {
      depth = 1; // Very shallow for very complex positions
    }
    
    console.log(`🤖 AI analyzing ${moves.length} moves at depth ${depth}...`);
    
    // Quick heuristic: prioritize captures and checks
    const moveScores: Array<{ move: any; score: number; isCapture: boolean; isCheck: boolean }> = [];
    
    for (const move of moves) {
      game.move(move);
      const quickScore = evaluatePosition(game);
      const isCapture = move.flags?.includes('c') || move.captured;
      const isCheck = game.isCheck();
      game.undo();
      
      let priority = quickScore;
      if (isCapture) priority += 100; // Prioritize captures
      if (isCheck) priority += 50; // Prioritize checks
      
      moveScores.push({ move, score: priority, isCapture, isCheck });
    }
    
    // Sort moves - best first
    moveScores.sort((a, b) => isMaximizing ? (b.score - a.score) : (a.score - b.score));
    
    // Evaluate top moves with minimax (limit to top 8 for speed)
    const topMoves = moveScores.slice(0, Math.min(8, moveScores.length));
    
    console.log(`   Evaluating top ${topMoves.length} moves with minimax...`);
    
    for (const { move } of topMoves) {
      game.move(move);
      const score = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
      game.undo();
      
      if (isMaximizing) {
        if (score > bestEval) {
          bestEval = score;
          bestMove = move;
        }
        // Early termination for checkmate
        if (score > 50000) {
          console.log(`   Found checkmate!`);
          break;
        }
      } else {
        if (score < bestEval) {
          bestEval = score;
          bestMove = move;
        }
        // Early termination for checkmate
        if (score < -50000) {
          console.log(`   Found checkmate!`);
          break;
        }
      }
    }
    
    console.log(`✅ AI selected best move with evaluation: ${bestEval.toFixed(2)}`);
    
    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q'
    };
  } catch (error) {
    console.error("Error getting computer move:", error);
    // Fallback to random move if minimax fails
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      from: randomMove.from,
      to: randomMove.to,
      promotion: randomMove.promotion || 'q'
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
