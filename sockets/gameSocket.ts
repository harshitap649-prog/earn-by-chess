import { Server } from "socket.io";
import { prisma } from "../db";

// Try to import chess.js - make it optional
let Chess: any = null;
let getComputerMove: any = null;

// Force load chess.js - don't fail silently
try {
  console.log("🔄 Attempting to load chess.js...");
  
  const chessModule = require("chess.js");
  console.log("   chess.js module loaded:", !!chessModule);
  
  // chess.js exports Chess as the default export
  Chess = chessModule.Chess || chessModule.default || chessModule;
  
  if (!Chess || typeof Chess !== 'function') {
    console.error("   Available exports:", Object.keys(chessModule || {}));
    throw new Error("Chess class not found in chess.js module");
  }
  
  console.log("   Chess class loaded:", !!Chess);
  
  // Test creating a Chess instance
  const testGame = new Chess();
  console.log("   Test Chess instance created:", !!testGame);
  console.log("   Test FEN:", testGame.fen());
  
  // Load computer player
  const computerPlayer = require("../services/computerPlayer");
  console.log("   computerPlayer module loaded:", !!computerPlayer);
  
  getComputerMove = computerPlayer.getComputerMove;
  console.log("   getComputerMove function loaded:", !!getComputerMove);
  
  if (!getComputerMove || typeof getComputerMove !== 'function') {
    throw new Error("getComputerMove function not found or not a function");
  }
  
  // Test the function
  const testMove = getComputerMove(testGame);
  console.log("   Test computer move generated:", !!testMove);
  
  console.log("✅✅✅ Chess.js loaded successfully and tested! ✅✅✅");
} catch (error: any) {
  console.error("❌❌❌ ERROR loading chess.js ❌❌❌");
  console.error("   Error message:", error?.message);
  console.error("   Error stack:", error?.stack);
  console.error("   Run: npm install chess.js@1.0.0-beta.6");
  console.error("   Then restart the server");
}

// Store game states for computer matches
const computerGames = new Map<string, any>();

export function initGameSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-match", async (data: { matchId: string; userId: string }) => {
      socket.join(`match-${data.matchId}`);
      socket.join(`user-${data.userId}`);
      console.log(`Socket ${socket.id} joined match ${data.matchId}`);
      
      // Check if this is a free match with computer opponent
      const match = await prisma.match.findUnique({
        where: { id: data.matchId },
      });
      
      if (match && Number(match.entryFee) === 0 && match.opponentId && Chess) {
        // Initialize game state for computer match
        if (!computerGames.has(data.matchId)) {
          computerGames.set(data.matchId, new Chess());
        }
        
        // Notify the player that computer is ready (emit to the room so client receives it)
        io.to(`match-${data.matchId}`).emit("player-joined", {
          userId: match.opponentId,
          socketId: "computer",
          isComputer: true,
        });
      } else {
        // Notify other players (human opponent)
        socket.to(`match-${data.matchId}`).emit("player-joined", {
          userId: data.userId,
          socketId: socket.id,
        });
      }
    });

    socket.on("leave-match", (matchId: string) => {
      socket.leave(`match-${matchId}`);
      // Clean up computer game state when player leaves
      computerGames.delete(matchId);
      console.log(`Socket ${socket.id} left match ${matchId}`);
    });

    socket.on("chess-move", async (data: { matchId: string; move: any; userId: string }) => {
      console.log(`\n🎯 ========== CHESS MOVE EVENT RECEIVED ==========`);
      console.log(`   Match ID: ${data.matchId}`);
      console.log(`   User ID: ${data.userId}`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Move data:`, data.move);
      console.log(`   Move type:`, typeof data.move);
      if (data.move && typeof data.move === 'object') {
        console.log(`   Move keys:`, Object.keys(data.move));
      }
      
      // Check if this is a computer match first
      const match = await prisma.match.findUnique({
        where: { id: data.matchId },
      });
      
      if (!match) {
        console.error(`❌ Match not found: ${data.matchId}`);
        return;
      }
      
      console.log(`   Match found:`, {
        id: match.id,
        entryFee: match.entryFee.toString(),
        opponentId: match.opponentId,
        creatorId: match.creatorId,
        status: match.status
      });
      
      // Only broadcast to other players if it's not a computer match
      // (computer matches handle moves differently)
      if (!(match && Number(match.entryFee) === 0 && match.opponentId)) {
        socket.to(`match-${data.matchId}`).emit("chess-move", {
          move: data.move,
          userId: data.userId,
        });
      }
      
      console.log(`Chess move in match ${data.matchId} by user ${data.userId}`);
      
      // Check if this is a computer match and the move is from the human player
      const isFreeMatch = match && Number(match.entryFee) === 0;
      const hasComputerOpponent = isFreeMatch && match.opponentId;
      
      // Reload getComputerMove if it's not available (hot reload fix)
      if (!getComputerMove && Chess) {
        try {
          delete require.cache[require.resolve("../services/computerPlayer")];
          const computerPlayer = require("../services/computerPlayer");
          getComputerMove = computerPlayer.getComputerMove;
          console.log("🔄 Reloaded getComputerMove function");
        } catch (e) {
          console.error("❌ Failed to reload getComputerMove:", e);
        }
      }
      
      const computerMoveAvailable = Chess && getComputerMove;
      
      console.log(`\n🔍 ========== COMPUTER MOVE CHECK ==========`);
      console.log(`   isFreeMatch: ${isFreeMatch} (entryFee: ${match?.entryFee}, type: ${typeof match?.entryFee})`);
      console.log(`   hasComputerOpponent: ${hasComputerOpponent} (opponentId: ${match?.opponentId})`);
      console.log(`   computerMoveAvailable: ${computerMoveAvailable} (Chess: ${!!Chess}, getComputerMove: ${!!getComputerMove})`);
      console.log(`   Move userId: ${data.userId}`);
      console.log(`   Match opponentId: ${match?.opponentId}`);
      console.log(`   Match creatorId: ${match?.creatorId}`);
      console.log(`   Is human player move: ${data.userId !== match.opponentId}`);
      
      if (!hasComputerOpponent) {
        console.log(`⚠️  ⚠️  ⚠️  MATCH HAS NO COMPUTER OPPONENT! ⚠️  ⚠️  ⚠️`);
        console.log(`   This match was created without a computer opponent.`);
        console.log(`   SOLUTION: Create a NEW match (the new one will have computer assigned).`);
      }
      
      if (!computerMoveAvailable) {
        console.log(`⚠️  ⚠️  ⚠️  COMPUTER MOVE FUNCTION NOT AVAILABLE! ⚠️  ⚠️  ⚠️`);
        console.log(`   SOLUTION: Restart the backend server to load the new AI code.`);
      }
      
      if (isFreeMatch && hasComputerOpponent && computerMoveAvailable) {
        // Only process if move is from human player (not computer)
        if (data.userId !== match.opponentId) {
          console.log(`\n✅ ========== PROCESSING COMPUTER MATCH MOVE ==========`);
          console.log(`   This is a computer match and move is from human player`);
          // This is a free match with computer
          let game = computerGames.get(data.matchId);
          if (!game) {
            // Initialize game if not exists
            game = new Chess();
            computerGames.set(data.matchId, game);
          }
          
          try {
            console.log(`📥 Player move received in match ${data.matchId}:`, data.move);
            console.log(`   Move type:`, typeof data.move);
            console.log(`   Move keys:`, Object.keys(data.move || {}));
            console.log(`   Current FEN before move: ${game.fen()}`);
            console.log(`   Current turn: ${game.turn()}`);
            
            // Handle different move formats
            let moveToApply: any;
            
            if (typeof data.move === 'string') {
              // SAN notation
              moveToApply = data.move;
            } else if (data.move.from && data.move.to) {
              // Object with from, to, promotion
              moveToApply = {
                from: data.move.from,
                to: data.move.to,
                promotion: data.move.promotion || 'q'
              };
            } else if (data.move.san) {
              // Move object with SAN notation
              moveToApply = data.move.san;
            } else {
              // Try to use the move object directly
              moveToApply = data.move;
            }
            
            console.log(`   Applying move:`, moveToApply);
            
            // Apply player's move to server game state
            const playerMoveResult = game.move(moveToApply);
            
            if (!playerMoveResult) {
              console.error(`❌ Failed to apply player move:`, moveToApply);
              console.error(`   Available moves:`, game.moves());
              console.error(`   Current FEN:`, game.fen());
              return;
            }
            
            console.log(`✅ Player move applied. New FEN: ${game.fen()}`);
            console.log(`   New turn: ${game.turn()}`);
            
            // Update the game state in the map
            computerGames.set(data.matchId, game);
            
            // Broadcast player's move to client
            io.to(`match-${data.matchId}`).emit("chess-move", {
              move: data.move,
              userId: data.userId,
            });
            
            // Check if game is over
            if (game.isGameOver()) {
              let winnerId = null;
              let reason = 'draw';
              
              if (game.isCheckmate()) {
                // Player wins (checkmate means the player who just moved won)
                winnerId = data.userId;
                reason = 'checkmate';
              } else if (game.isDraw()) {
                reason = 'draw';
              }
              
              io.to(`match-${data.matchId}`).emit("game-over", {
                winnerId,
                reason,
                isDraw: game.isDraw(),
              });
              return;
            }
            
            // Make computer move immediately (use process.nextTick for immediate execution)
            console.log(`\n🤖 ========== MAKING COMPUTER MOVE NOW ==========`);
            console.log(`   Match ID: ${data.matchId}`);
            console.log(`   Timestamp: ${new Date().toISOString()}`);
            
            // Use process.nextTick to execute immediately after current operation
            process.nextTick(() => {
              try {
                console.log(`🤖 Computer move execution started`);
                
                // Verify computer move function is available
                if (!getComputerMove) {
                  console.error(`❌ Computer move function not available`);
                  console.error(`   Chess available: ${!!Chess}`);
                  console.error(`   getComputerMove available: ${!!getComputerMove}`);
                  return;
                }
                
                // Get the current game state to ensure we have the latest
                const currentGame = computerGames.get(data.matchId);
                if (!currentGame) {
                  console.error(`❌ Game state not found for match ${data.matchId}`);
                  console.error(`   Available game states:`, Array.from(computerGames.keys()));
                  return;
                }
                
                // After human player's move, it should now be computer's turn
                // Check if game is already over before making computer move
                if (currentGame.isGameOver()) {
                  console.log(`⚠️ Game already over, skipping computer move`);
                  console.log(`   Game over reason:`, {
                    checkmate: currentGame.isCheckmate(),
                    draw: currentGame.isDraw(),
                    stalemate: currentGame.isStalemate(),
                  });
                  return;
                }
                
                const currentTurn = currentGame.turn();
                console.log(`🤖 Getting computer move for match ${data.matchId}...`);
                console.log(`   Current turn: ${currentTurn} (${currentTurn === 'w' ? 'White' : 'Black'})`);
                console.log(`   Computer is opponent (${match.opponentId}), player is creator (${match.creatorId})`);
                console.log(`   Current FEN: ${currentGame.fen()}`);
                console.log(`   Available moves:`, currentGame.moves().slice(0, 5), '...');
                
                // Get computer move
                const computerMoveInput = getComputerMove(currentGame);
                if (!computerMoveInput) {
                  console.log(`⚠️ No valid moves available for computer in match ${data.matchId}`);
                  console.log(`   Available moves:`, currentGame.moves());
                  return;
                }
                
                console.log(`🤖 Computer attempting move:`, computerMoveInput);
                
                // Apply the move and get the full move object
                const computerMoveResult = currentGame.move(computerMoveInput);
                
                if (!computerMoveResult) {
                  console.error(`❌ Failed to apply computer move:`, computerMoveInput);
                  console.error(`   Available moves:`, currentGame.moves());
                  console.error(`   Current FEN:`, currentGame.fen());
                  return;
                }
                
                console.log(`✅ Computer made move:`, computerMoveResult);
                console.log(`   New FEN: ${currentGame.fen()}`);
                console.log(`   New turn: ${currentGame.turn()}`);
                
                // Update game state in map
                computerGames.set(data.matchId, currentGame);
                
                // Broadcast computer's move - send in a format the client can easily use
                const computerMoveToSend = {
                  from: computerMoveResult.from,
                  to: computerMoveResult.to,
                  promotion: computerMoveResult.promotion,
                  // Include full move object for compatibility
                  ...computerMoveResult
                };
                
                console.log(`📤 Broadcasting computer move to room: match-${data.matchId}`);
                console.log(`   Move to send:`, {
                  from: computerMoveToSend.from,
                  to: computerMoveToSend.to,
                  promotion: computerMoveToSend.promotion,
                  san: computerMoveResult.san
                });
                console.log(`   Broadcasting to all sockets in room: match-${data.matchId}`);
                
                // Emit to all clients in the match room
                io.to(`match-${data.matchId}`).emit("chess-move", {
                  move: computerMoveToSend,
                  userId: match.opponentId,
                  isComputer: true,
                });
                
                console.log(`✅ Computer move broadcasted successfully!`);
                
                // Check if game is over after computer move
                if (currentGame.isGameOver()) {
                  let winnerId = null;
                  let reason = 'draw';
                  
                  if (currentGame.isCheckmate()) {
                    winnerId = match.opponentId;
                    reason = 'checkmate';
                  } else if (currentGame.isDraw()) {
                    reason = 'draw';
                  }
                  
                  io.to(`match-${data.matchId}`).emit("game-over", {
                    winnerId,
                    reason,
                    isDraw: currentGame.isDraw(),
                  });
                }
              } catch (error: any) {
                console.error("❌ Error making computer move:", error);
                console.error("Error message:", error?.message);
                console.error("Error stack:", error?.stack);
              }
            });
          } catch (error) {
            console.error("Error applying player move:", error);
          }
        }
      }
    });

    socket.on("game-over", (data: { matchId: string; winnerId: string; reason: string; isDraw?: boolean }) => {
      // Broadcast game over to all players
      io.to(`match-${data.matchId}`).emit("game-over", {
        winnerId: data.winnerId,
        reason: data.reason,
        isDraw: data.isDraw || false,
      });
      console.log(`Game over in match ${data.matchId}, winner: ${data.winnerId}, draw: ${data.isDraw || false}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
