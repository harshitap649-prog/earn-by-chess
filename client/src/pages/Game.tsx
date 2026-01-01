import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Chess } from 'chess.js'
import { io, Socket } from 'socket.io-client'
import api from '../services/api'
import ChessBoard from '../components/ChessBoard'
import Navigation from '../components/Navigation'
import './Game.css'

interface Match {
  id: string
  creatorId: string
  opponentId: string | null
  entryFee: number
  status: string
  creator?: { name: string }
  opponent?: { name: string }
}

// Calculate prize based on entry fee (same as backend)
function calculatePrize(entryFee: number): { winnerPrize: number; platformProfit: number; totalPool: number } {
  const totalPool = entryFee * 2
  let winnerPrize: number
  let platformProfit: number

  if (entryFee === 2) {
    winnerPrize = 3
    platformProfit = 1
  } else if (entryFee === 4) {
    winnerPrize = 7
    platformProfit = 1
  } else if (entryFee === 10) {
    winnerPrize = 18
    platformProfit = 2
  } else {
    platformProfit = Math.round(totalPool * 0.1)
    winnerPrize = totalPool - platformProfit
  }

  return { winnerPrize, platformProfit, totalPool }
}

export default function Game() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [game, setGame] = useState(new Chess())
  const [match, setMatch] = useState<Match | null>(null)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [gameStatus, setGameStatus] = useState('')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const gameRef = useRef<Chess>(game)

  // Keep game ref in sync
  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    if (!matchId || !user) return

    loadMatch()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [matchId, user?.id])

  const loadMatch = async () => {
    try {
      const response = await api.get(`/match/${matchId}`)
      const matchData = response.data
      
      if (!matchData) {
        throw new Error('Match data not found')
      }
      
      setMatch(matchData)

      // Determine player color
      const isCreator = matchData.creatorId === user?.id
      const color = isCreator ? 'white' : 'black'
      setPlayerColor(color)

      // Check if opponent has joined
      // For free play matches (entryFee === 0), allow practice mode even without opponent
      const isFreePlay = Number(matchData.entryFee) === 0;
      const hasComputerOpponent = isFreePlay && matchData.opponentId;
      
      // If match is started and has opponent (including computer), game is ready
      if (matchData.status === 'started' && (matchData.opponentId || isFreePlay)) {
        setWaitingForOpponent(false)
        // Set turn based on game state
        const currentTurn = gameRef.current.turn()
        setIsPlayerTurn(
          (currentTurn === 'w' && color === 'white') || 
          (currentTurn === 'b' && color === 'black')
        )
        
        // If computer opponent exists, log it
        if (hasComputerOpponent) {
          console.log('✅ Computer opponent ready:', matchData.opponentId)
          console.log('🎮 Free play match with AI - game ready to start!')
        }
      } else if (matchData.status === 'waiting' || (!matchData.opponentId && !isFreePlay)) {
        setWaitingForOpponent(true)
        setIsPlayerTurn(false)
      } else {
        // Match is started but no opponent yet (shouldn't happen for free play, but handle it)
        setWaitingForOpponent(false)
        const currentTurn = gameRef.current.turn()
        setIsPlayerTurn(
          (currentTurn === 'w' && color === 'white') || 
          (currentTurn === 'b' && color === 'black')
        )
      }

      // Initialize socket with better connection settings
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Try both websocket and polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        timeout: 20000,
        forceNew: false, // Reuse existing connection if available
        autoConnect: true,
      })

      socket.on('connect', () => {
        console.log('✅ Socket connected')
        console.log('   Socket ID:', socket.id)
        console.log('   Joining match:', matchId)
        console.log('   User ID:', user?.id)
        
        // Join the match room
        socket.emit('join-match', { matchId, userId: user?.id })
        
        // Also manually join the room (backup)
        socket.emit('join', `match-${matchId}`)
      })
      
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        console.error('   Make sure the backend server is running on http://localhost:3000')
      })

      socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason)
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, reconnect manually
          socket.connect()
        }
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`)
        socket.emit('join-match', { matchId, userId: user?.id })
      })

      socket.on('player-joined', (data: { userId: string; isComputer?: boolean }) => {
        console.log('👤 Player joined event:', data.userId, 'isComputer:', data.isComputer)
        console.log('   Current user ID:', user?.id)
        console.log('   Match data:', matchData)
        
        if (data.isComputer) {
          // Computer opponent joined for free play
          console.log('🤖 Computer opponent joined!')
          setWaitingForOpponent(false)
          api.get(`/match/${matchId}`).then(res => {
            setMatch(res.data)
            const currentTurn = gameRef.current.turn()
            const color = res.data.creatorId === user?.id ? 'white' : 'black'
            setIsPlayerTurn(
              (currentTurn === 'w' && color === 'white') || 
              (currentTurn === 'b' && color === 'black')
            )
            console.log('✅ Game ready with computer opponent')
          }).catch(err => {
            console.error('Error refreshing match after computer joined:', err)
          })
        } else if (data.userId !== user?.id) {
          // Human opponent joined
          setWaitingForOpponent(false)
          api.get(`/match/${matchId}`).then(res => {
            setMatch(res.data)
            const currentTurn = gameRef.current.turn()
            const color = res.data.creatorId === user?.id ? 'white' : 'black'
            setIsPlayerTurn(
              (currentTurn === 'w' && color === 'white') || 
              (currentTurn === 'b' && color === 'black')
            )
          })
        }
      })

      socket.on('chess-move', (data: { move: any; userId: string; isComputer?: boolean }) => {
        console.log('📥 Chess move event received:', {
          userId: data.userId,
          isComputer: data.isComputer,
          moveFrom: data.move?.from,
          moveTo: data.move?.to,
          currentUserId: user?.id
        })
        
        if (data.userId !== user?.id) {
          console.log('📥 Opponent move received:', data.move, 'isComputer:', data.isComputer)
          try {
            const currentFen = gameRef.current.fen()
            const newGame = new Chess(currentFen)
            
            console.log('   Current game FEN:', currentFen)
            console.log('   Move data:', data.move)
            
            // Apply the move - handle both move object format and {from, to, promotion} format
            let moveResult
            if (typeof data.move === 'string') {
              // SAN notation
              console.log('   Applying move as SAN:', data.move)
              moveResult = newGame.move(data.move)
            } else if (data.move.from && data.move.to) {
              // Object with from, to, promotion
              console.log('   Applying move as object:', {
                from: data.move.from,
                to: data.move.to,
                promotion: data.move.promotion
              })
              moveResult = newGame.move({
                from: data.move.from,
                to: data.move.to,
                promotion: data.move.promotion || 'q'
              })
            } else if (data.move.san) {
              // Move has SAN notation
              console.log('   Applying move using SAN from object:', data.move.san)
              moveResult = newGame.move(data.move.san)
            } else {
              // Try to use the move object directly
              console.log('   Trying to apply move object directly')
              moveResult = newGame.move(data.move)
            }
            
            if (moveResult) {
              console.log('✅ Opponent move applied successfully:', moveResult)
              console.log('   New FEN:', newGame.fen())
              console.log('   New turn:', newGame.turn())
              
              setGame(newGame)
              setMoveHistory(newGame.history())
              
              // Update turn - after opponent (computer) moves, it's player's turn
              const currentTurn = newGame.turn()
              const isPlayerTurnNow = (currentTurn === 'w' && playerColor === 'white') || 
                                     (currentTurn === 'b' && playerColor === 'black')
              setIsPlayerTurn(isPlayerTurnNow)
              
              console.log('   Player turn updated:', isPlayerTurnNow)
              
              updateGameStatus(newGame)
            } else {
              console.error('❌ Failed to apply opponent move:', data.move)
              console.error('   Current FEN:', currentFen)
              console.error('   Available moves:', newGame.moves().slice(0, 5))
              console.error('   Move object keys:', Object.keys(data.move || {}))
            }
          } catch (e: any) {
            console.error('❌ Invalid move received:', e)
            console.error('   Error message:', e?.message)
            console.error('   Move data:', data.move)
            console.error('   Current FEN:', gameRef.current.fen())
          }
        } else {
          console.log('   Move is from current user, ignoring')
        }
      })

      socket.on('game-over', async (data: { winnerId: string; reason: string; isDraw?: boolean }) => {
        const entryFee = Number(matchData.entryFee)
        const { winnerPrize } = calculatePrize(entryFee)
        
        if (data.isDraw) {
          setGameStatus('Draw! Entry fees refunded')
        } else {
          const winMessage = data.winnerId === user?.id ? `You Won! 🎉 +₹${winnerPrize}` : `You Lost -₹${entryFee}`
          setGameStatus(winMessage)
        }
        setIsPlayerTurn(false)
        
        // Complete match on backend
        try {
          await api.post(`/match/complete/${matchId}`, { 
            winnerId: data.winnerId,
            isDraw: data.isDraw || false
          })
        } catch (e) {
          console.error('Failed to complete match:', e)
        }
      })

      socket.on('match-completed', (data: { winnerId?: string; isDraw?: boolean }) => {
        // Use matchData from the closure
        const entryFee = Number(matchData.entryFee)
        const { winnerPrize } = calculatePrize(entryFee)
        
        if (data.isDraw) {
          setGameStatus('Draw! Entry fees refunded')
        } else if (data.winnerId === user?.id) {
          setGameStatus(`You Won! 🎉 +₹${winnerPrize}`)
        } else {
          setGameStatus(`You Lost -₹${entryFee}`)
        }
        setIsPlayerTurn(false)
      })

      socketRef.current = socket
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load match:', err)
      if (err.response?.status === 404) {
        navigate('/dashboard')
      }
      setLoading(false)
    }
  }

  const updateGameStatus = (gameInstance: Chess) => {
    if (gameInstance.isCheckmate()) {
      const winner = gameInstance.turn() === 'w' ? 'black' : 'white'
      const winnerColor = winner === 'white' ? 'w' : 'b'
      setGameStatus(winner === playerColor ? 'Checkmate! You Won! 🎉' : 'Checkmate! You Lost')
      setIsPlayerTurn(false)
      
      if (socketRef.current && match) {
        const winnerId = winnerColor === 'w' ? match.creatorId : match.opponentId
        socketRef.current.emit('game-over', {
          matchId,
          winnerId,
          reason: 'checkmate',
        })
      }
    } else if (gameInstance.isDraw()) {
      const drawReason = gameInstance.isStalemate() ? 'Stalemate' : 
                        gameInstance.isThreefoldRepetition() ? 'Threefold Repetition' :
                        gameInstance.isInsufficientMaterial() ? 'Insufficient Material' : 'Draw'
      setGameStatus(`${drawReason}! Entry fees will be refunded`)
      setIsPlayerTurn(false)
      
      if (socketRef.current && match) {
        socketRef.current.emit('game-over', {
          matchId,
          winnerId: '',
          reason: 'draw',
          isDraw: true,
        })
      }
    } else if (gameInstance.isCheck()) {
      setGameStatus('Check!')
    } else {
      setGameStatus('')
    }
  }

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    const isFreePlay = match ? Number(match.entryFee) === 0 : false
    const isPracticeMode = isFreePlay && !match?.opponentId
    const hasComputerOpponent = isFreePlay && match?.opponentId
    
    // In practice mode, allow moves regardless of turn
    // For regular games (including computer matches), check turn and opponent
    if (!isPracticeMode) {
      if (!isPlayerTurn || !socketRef.current || waitingForOpponent) return
    } else {
      // In practice mode, socket might not be needed, but still try to use it if available
      if (!socketRef.current && !isFreePlay) return
    }

    try {
      const currentFen = gameRef.current.fen()
      const newGame = new Chess(currentFen)
      const moveResult = newGame.move({
        from: move.from as any,
        to: move.to as any,
        promotion: move.promotion || 'q',
      })

      if (moveResult) {
        setGame(newGame)
        setMoveHistory(newGame.history())
        
        // Update turn
        const currentTurn = newGame.turn()
        // In practice mode, always allow moves (user plays both sides)
        if (isPracticeMode) {
          setIsPlayerTurn(true) // Always allow moves in practice mode
        } else if (hasComputerOpponent) {
          // For computer matches, disable player turn after move (wait for computer)
          setIsPlayerTurn(false)
        } else {
          setIsPlayerTurn(
            (currentTurn === 'w' && playerColor === 'white') || 
            (currentTurn === 'b' && playerColor === 'black')
          )
        }
        
        updateGameStatus(newGame)

        // Send move to opponent (or just track it in practice mode)
        if (socketRef.current) {
          if (socketRef.current.connected) {
            console.log(`📤 Sending move to server:`, moveResult);
            socketRef.current.emit('chess-move', {
              matchId,
              move: moveResult,
              userId: user?.id,
            });
          } else {
            console.error('❌ Socket not connected! Cannot send move to server.');
            console.error('   Make sure the backend server is running on http://localhost:3000');
            // Still update local game state even if socket isn't connected
            if (hasComputerOpponent) {
              alert('⚠️ Cannot connect to server. Computer moves will not work. Please refresh the page.');
            }
          }
        } else {
          console.error('❌ Socket not initialized!');
        }
      }
    } catch (e) {
      console.error('Invalid move:', e)
    }
  }

  // Update move history when game changes
  useEffect(() => {
    setMoveHistory(game.history())
  }, [game])

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading">Loading game...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="game-container">
        <div className="loading">Match not found</div>
      </div>
    )
  }

  const entryFee = Number(match.entryFee)
  const { winnerPrize, platformProfit, totalPool } = calculatePrize(entryFee)
  const isFreePlay = entryFee === 0
  const hasComputerOpponent = isFreePlay && match.opponentId
  const opponentName = match.creatorId === user?.id 
    ? (hasComputerOpponent ? '🤖 Chess AI' : (match.opponent?.name || (isFreePlay ? 'Practice Mode (Play Alone)' : 'Waiting for opponent...')))
    : match.creator?.name || 'Unknown'

  const currentTurn = game.turn()
  const isWhiteTurn = currentTurn === 'w'

  return (
    <div className="game-container">
      <Navigation />
      <div className="game-header">
        <h1>
          {isFreePlay && !match.opponentId 
            ? '🎮 Practice Mode - Free Play' 
            : `Chess Match - ₹${entryFee.toFixed(2)} Entry${entryFee > 0 ? ` (Win ₹${winnerPrize})` : ''}`}
        </h1>
        <div className="match-info">
          <div className={`player-info ${playerColor === 'white' ? 'active' : ''}`}>
            <span className="player-name">{user?.name}</span>
            <span className="player-color">({playerColor})</span>
          </div>
          <div className="vs-divider">VS</div>
          <div className={`player-info ${playerColor === 'black' ? 'active' : ''}`}>
            <span className="player-name">{opponentName}</span>
            <span className="player-color">({playerColor === 'white' ? 'black' : 'white'})</span>
          </div>
          {!isFreePlay && <div className="prize-info">Prize: ₹{winnerPrize} for winner</div>}
          {isFreePlay && <div className="prize-info">🎮 Practice Mode - No entry fee, no prizes</div>}
        </div>
      </div>

      <div className="game-content">
        <div className="game-board-section">
          {waitingForOpponent && !isFreePlay && (
            <div className="waiting-message">
              <div className="spinner"></div>
              <p>Waiting for opponent to join...</p>
              <p className="waiting-subtext">Share this match with a friend or open in another browser to play!</p>
            </div>
          )}
          
          {isFreePlay && !match.opponentId && (
            <div className="practice-mode-message">
              <p>🎮 <strong>Practice Mode</strong></p>
              <p className="practice-subtext">Play against yourself or practice your moves. No opponent required!</p>
            </div>
          )}
          
          {hasComputerOpponent && (
            <div className="practice-mode-message" style={{ background: 'rgba(102, 126, 234, 0.1)', borderColor: 'var(--accent-primary)' }}>
              <p>🤖 <strong>Playing Against Chess AI</strong></p>
              <p className="practice-subtext">The computer will make its move automatically after yours. Good luck!</p>
            </div>
          )}
          
          {gameStatus && (
            <div className={`game-status ${gameStatus.includes('Won') ? 'win' : gameStatus.includes('Lost') ? 'lose' : gameStatus.includes('Draw') ? 'draw' : ''}`}>
              {gameStatus}
            </div>
          )}
          
          {(!waitingForOpponent || isFreePlay) && (
            <div className={`turn-indicator ${isPlayerTurn ? 'your-turn' : 'opponent-turn'}`}>
              {isPlayerTurn ? (
                <span>✅ Your Turn ({isWhiteTurn ? 'White' : 'Black'})</span>
              ) : (
                <span>⏳ {hasComputerOpponent ? '🤖 Computer\'s Turn' : (isFreePlay && !match.opponentId ? 'Switch Sides' : 'Opponent\'s Turn')} ({isWhiteTurn ? 'White' : 'Black'})</span>
              )}
            </div>
          )}
          
          {/* Always show chess board, even when waiting or in practice mode */}
          <ChessBoard
            game={game}
            onMove={handleMove}
            isPlayerTurn={isPlayerTurn && (!waitingForOpponent || isFreePlay)}
            playerColor={playerColor}
          />
          
          {waitingForOpponent && !isFreePlay && (
            <div className="waiting-note">
              <p>💡 <strong>Tip:</strong> You can practice moves on the board while waiting. The game will start when your opponent joins!</p>
            </div>
          )}
          
          {isFreePlay && !match.opponentId && (
            <div className="practice-note">
              <p>💡 <strong>Practice Mode:</strong> You can play both sides. Make moves for white and black to practice different strategies!</p>
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <div className="info-card">
            <h3>Match Details</h3>
            <div className="info-item">
              <span>Entry Fee:</span>
              <span>₹{entryFee.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span>Winner Gets:</span>
              <span className="highlight">₹{winnerPrize}</span>
            </div>
            <div className="info-item">
              <span>Status:</span>
              <span className={`status-badge ${match.status}`}>{match.status.toUpperCase()}</span>
            </div>
          </div>

          <div className="info-card">
            <h3>Move History</h3>
            <div className="move-history">
              {moveHistory.length === 0 ? (
                <p className="no-moves">No moves yet</p>
              ) : (
                <div className="moves-list">
                  {moveHistory.map((move, index) => (
                    <div key={index} className="move-item">
                      <span className="move-number">{Math.floor(index / 2) + 1}.</span>
                      <span className="move-text">{move}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isFreePlay && (
            <div className="info-card">
              <h3>Game Rules</h3>
              <ul>
                <li>Standard chess rules apply</li>
                <li>Winner takes ₹18</li>
                <li>Loser loses entry fee</li>
                <li>Draw = refund entry fees</li>
                <li>Checkmate wins the game</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

