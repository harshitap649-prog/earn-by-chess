import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Chess } from 'chess.js'
import { io, Socket } from 'socket.io-client'
import api from '../services/api'
import ChessBoard from '../components/ChessBoard'
import Navigation from '../components/Navigation'
import { getComputerMove } from '../utils/computerPlayer'
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
    if (!matchId) {
      // If no matchId, redirect to dashboard
      navigate('/dashboard')
      return
    }

    // For free play matches (practice mode), allow loading even without user
    // Check if it's a practice match ID
    const isPracticeMatch = matchId.startsWith('practice-')
    
    if (isPracticeMatch) {
      // Practice mode - don't need user or API
      // Always add computer opponent for AI in practice matches
      console.log('🎮 Practice mode detected - loading without API')
      const defaultMatch: Match = {
        id: matchId,
        creatorId: user?.id || 'practice-user',
        opponentId: 'computer-ai', // Always add computer opponent for AI
        entryFee: 0,
        status: 'started',
        creator: { name: user?.name || 'You' },
      }
      setMatch(defaultMatch)
      setPlayerColor('white')
      setWaitingForOpponent(false)
      setIsPlayerTurn(true)
      setLoading(false)
      console.log('🤖 Computer AI enabled for practice match')
      return
    }

    // For real matches, wait for user but with timeout
    if (!user) {
      // Wait a bit for auth to load, but don't wait forever
      const timeout = setTimeout(() => {
        console.warn('⚠️ User not loaded after timeout, allowing practice mode')
        // Allow practice mode even without user
        const defaultMatch: Match = {
          id: matchId,
          creatorId: 'unknown',
          opponentId: null,
          entryFee: 0,
          status: 'started',
          creator: { name: 'Guest' },
        }
        setMatch(defaultMatch)
        setPlayerColor('white')
        setWaitingForOpponent(false)
        setIsPlayerTurn(true)
        setLoading(false)
      }, 3000) // Wait 3 seconds for auth

      return () => clearTimeout(timeout)
    }

    loadMatch()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [matchId, user?.id, navigate])

  const loadMatch = async () => {
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      setLoading(true)
      console.log('Loading match:', matchId)
      
      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('⚠️ API request timeout - enabling practice mode')
        const defaultMatch: Match = {
          id: matchId || 'unknown',
          creatorId: user?.id || 'unknown',
          opponentId: null,
          entryFee: 0,
          status: 'started',
          creator: { name: user?.name || 'You' },
        }
        setMatch(defaultMatch)
        setPlayerColor('white')
        setWaitingForOpponent(false)
        setIsPlayerTurn(true)
        setLoading(false)
      }, 10000) // 10 second timeout
      
      const response = await api.get(`/match/${matchId}`)
      
      // Clear timeout if request succeeded
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      const matchData = response.data
      
      console.log('Match data received:', matchData)
      
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
      
      // For free play matches, always allow practice mode (don't wait for opponent)
      if (isFreePlay) {
        setWaitingForOpponent(false)
        // Always allow moves in free play mode
        setIsPlayerTurn(true)
        console.log('🎮 Free play match - practice mode enabled')
        
        if (hasComputerOpponent) {
          console.log('✅ Computer opponent ready:', matchData.opponentId)
          console.log('🎮 Free play match with AI - game ready to start!')
        }
      } else {
        // For paid matches, check if opponent has joined
        if (matchData.status === 'started' && matchData.opponentId) {
          setWaitingForOpponent(false)
          // Set turn based on game state
          const currentTurn = gameRef.current.turn()
          setIsPlayerTurn(
            (currentTurn === 'w' && color === 'white') || 
            (currentTurn === 'b' && color === 'black')
          )
        } else {
          // Waiting for opponent
          setWaitingForOpponent(true)
          setIsPlayerTurn(false)
        }
      }

      // Initialize socket with better connection settings
      // Note: Socket.io won't work on Vercel serverless functions
      // The game will still work in practice mode without Socket.io
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
        
        // Only try to connect Socket.io if we're not on Vercel
        // On Vercel, Socket.io won't work, so skip it
        const isVercel = window.location.hostname.includes('vercel.app')
        
        if (isVercel) {
          console.log('⚠️ Running on Vercel - Socket.io disabled. Using client-side AI.')
          // For free play matches on Vercel, enable computer opponent automatically
          if (isFreePlay) {
            // If no computer opponent, add one for AI
            if (!matchData.opponentId) {
              const matchWithAI: Match = {
                ...matchData,
                opponentId: 'computer-ai'
              }
              setMatch(matchWithAI)
              console.log('🤖 Computer AI enabled for free play on Vercel')
            }
            setWaitingForOpponent(false)
            setIsPlayerTurn(true)
            setLoading(false)
            console.log('✅ Free play match on Vercel - board ready with AI!')
            return
          }
          // For paid matches on Vercel, still try to show board but without socket
          setLoading(false)
          return
        }
        
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
      } catch (socketError: any) {
        console.error('Socket initialization error:', socketError)
        // Continue without Socket.io - game will work in practice mode
        setLoading(false)
      }
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      // Safely extract error information
      const errorMessage = err?.message || 'Unknown error';
      const errorStatus = err?.response?.status;
      const errorData = err?.response?.data;
      
      // Log error details safely (convert objects to strings)
      console.error('Failed to load match:', errorMessage);
      if (errorStatus) {
        console.error('Error status:', errorStatus);
      }
      if (errorData) {
        const errorDataString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        console.error('Error data:', errorDataString);
      }
      
      // If 404, navigate away
      if (errorStatus === 404) {
        console.error('Match not found, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }
      
      // For other errors (network, 500, etc.), show a default match state
      // This allows the game to still render in practice mode
      console.warn('API error, but allowing game to render in practice mode');
      const defaultMatch: Match = {
        id: matchId || 'unknown',
        creatorId: user?.id || 'unknown',
        opponentId: null,
        entryFee: 0, // Default to free play
        status: 'started', // Set to started so board is immediately available
        creator: { name: user?.name || 'You' },
      };
      setMatch(defaultMatch);
      setPlayerColor('white');
      setWaitingForOpponent(false); // Allow practice mode
      setIsPlayerTurn(true); // Allow moves
      
      // Don't try to connect Socket.io if API failed
      // Game will work in practice mode without Socket.io
      console.log('⚠️ Socket.io disabled due to API error. Game will work in practice mode only.');
      console.log('✅ Free play mode enabled - chess board will be visible!');
      
      setLoading(false);
    }
  }

  const updateGameStatus = (gameInstance: Chess) => {
    if (gameInstance.isCheckmate()) {
      const winner = gameInstance.turn() === 'w' ? 'black' : 'white'
      const winnerColor = winner === 'white' ? 'w' : 'b'
      setGameStatus(winner === playerColor ? 'Checkmate! You Won! 🎉' : 'Checkmate! You Lost')
      setIsPlayerTurn(false)
      
      const currentMatch = match || displayMatch;
      if (socketRef.current && currentMatch) {
        const winnerId = winnerColor === 'w' ? currentMatch.creatorId : currentMatch.opponentId
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
      
      const currentMatch = match || displayMatch;
      if (socketRef.current && currentMatch) {
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
    const currentMatch = match || displayMatch;
    const isFreePlay = currentMatch ? Number(currentMatch.entryFee) === 0 : false
    const isPracticeMode = isFreePlay && !currentMatch?.opponentId
    const hasComputerOpponent = isFreePlay && currentMatch?.opponentId
    const isVercel = window.location.hostname.includes('vercel.app')
    
    // For free play matches, always allow moves (practice mode works without Socket.io)
    if (isFreePlay) {
      // Always allow moves in free play mode - no socket required
      // On Vercel, free play works perfectly without socket
    } else {
      // For paid matches, check turn, socket, and opponent
      if (!isPlayerTurn || waitingForOpponent) return
      // On Vercel, Socket.io won't work, so allow moves without socket for free play
      // For paid matches, we still need socket (but it won't work on Vercel)
      if (!isVercel && !socketRef.current) return
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
        const isVercel = window.location.hostname.includes('vercel.app')
        
        // For free play matches, always use AI (simplified logic)
        if (isFreePlay) {
          // Check if it's practice mode (no opponent) or AI mode (with opponent)
          if (isPracticeMode) {
            // Practice mode - user plays both sides
            setIsPlayerTurn(true)
          } else {
            // AI mode - computer will play
            setIsPlayerTurn(false)
            
            // Always use client-side AI for free play matches
            console.log('🤖 Free play match - using client-side AI')
            console.log('   Match ID:', currentMatch?.id)
            console.log('   Opponent ID:', currentMatch?.opponentId)
            console.log('   Is Practice Mode:', isPracticeMode)
            console.log('   Has Computer Opponent:', hasComputerOpponent)
            
            // Calculate computer move with timeout protection
            const moveTimeout = setTimeout(() => {
              console.warn('⚠️ Computer move calculation timeout - using quick fallback')
              try {
                const fallbackGame = new Chess(newGame.fen())
                const moves = fallbackGame.moves({ verbose: true })
                if (moves.length > 0) {
                  // Find best capture or first move
                  let bestMove = moves[0]
                  let bestScore = -Infinity
                  for (const move of moves) {
                    let score = 0
                    if (move.captured) {
                      const pieceValues: { [key: string]: number } = {
                        'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
                      }
                      score += pieceValues[move.captured] || 0
                    }
                    fallbackGame.move(move)
                    if (fallbackGame.isCheck()) score += 50
                    fallbackGame.undo()
                    if (score > bestScore) {
                      bestScore = score
                      bestMove = move
                    }
                  }
                  const result = fallbackGame.move(bestMove)
                  if (result) {
                    setGame(fallbackGame)
                    setMoveHistory(fallbackGame.history())
                    setIsPlayerTurn(true)
                    updateGameStatus(fallbackGame)
                    console.log('✅ Fallback move applied:', result)
                  }
                }
              } catch (e) {
                console.error('Fallback failed:', e)
                setIsPlayerTurn(true)
              }
            }, 15000) // 15 second timeout
            
            // Calculate AI move
            setTimeout(() => {
              try {
                const startTime = Date.now()
                console.log('🤖 Starting PRO AI calculation...')
                console.log('   Current FEN:', newGame.fen())
                console.log('   Current turn:', newGame.turn())
                
                const computerMove = getComputerMove(newGame)
                const calcTime = Date.now() - startTime
                console.log(`⏱️ Move calculation took ${calcTime}ms`)
                
                clearTimeout(moveTimeout)
                
                if (computerMove) {
                  console.log('🤖 Computer move calculated:', computerMove)
                  const computerGame = new Chess(newGame.fen())
                  
                  // Try standard move format
                  let computerMoveResult = computerGame.move({
                    from: computerMove.from,
                    to: computerMove.to,
                    promotion: computerMove.promotion
                  })
                  
                  if (!computerMoveResult) {
                    // Try alternative format
                    computerGame.load(newGame.fen())
                    computerMoveResult = computerGame.move(`${computerMove.from}${computerMove.to}${computerMove.promotion || ''}`)
                  }
                  
                  if (computerMoveResult) {
                    console.log('✅ Computer move applied:', computerMoveResult)
                    setGame(computerGame)
                    setMoveHistory(computerGame.history())
                    setIsPlayerTurn(true) // Player's turn again
                    updateGameStatus(computerGame)
                  } else {
                    console.error('❌ Failed to apply computer move:', computerMove)
                    console.error('   Available moves:', computerGame.moves({ verbose: true }).slice(0, 5))
                    setIsPlayerTurn(true)
                  }
                } else {
                  console.warn('⚠️ No computer move available')
                  setIsPlayerTurn(true)
                }
              } catch (error) {
                console.error('❌ Error calculating computer move:', error)
                console.error('   Error details:', error)
                clearTimeout(moveTimeout)
                setIsPlayerTurn(true)
              }
            }, 200) // Small delay for UI update
          }
        } else {
          // For free play, always allow moves
          setIsPlayerTurn(true)
        } else {
          // For paid matches, check if it's player's turn
          setIsPlayerTurn(
            (currentTurn === 'w' && playerColor === 'white') || 
            (currentTurn === 'b' && playerColor === 'black')
          )
        }
        
        updateGameStatus(newGame)

        // Send move to opponent (or just track it in practice mode)
        // On Vercel, Socket.io won't work, so skip sending moves
        if (!isVercel && socketRef.current) {
          if (socketRef.current.connected) {
            console.log(`📤 Sending move to server:`, moveResult);
            socketRef.current.emit('chess-move', {
              matchId,
              move: moveResult,
              userId: user?.id,
            });
          } else {
            console.warn('⚠️ Socket not connected. Move saved locally only.');
            // Still update local game state even if socket isn't connected
            if (hasComputerOpponent && !isVercel) {
              console.warn('⚠️ Cannot connect to server. Computer moves will not work.');
            }
          }
        } else if (isVercel && hasComputerOpponent) {
          console.log('📤 Move made (Vercel - client-side AI will respond)');
        } else if (isVercel) {
          console.log('📤 Move made (Vercel - Socket.io disabled, move saved locally)');
        } else {
          console.warn('⚠️ Socket not initialized. Move saved locally only.');
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

  // Safety timeout - if loading takes too long, show the board anyway
  useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout - forcing board to render')
        setLoading(false)
        // Set default match if none exists
        if (!match) {
          const defaultMatch: Match = {
            id: matchId || 'practice',
            creatorId: user?.id || 'unknown',
            opponentId: null,
            entryFee: 0,
            status: 'started',
            creator: { name: user?.name || 'You' },
          }
          setMatch(defaultMatch)
          setPlayerColor('white')
          setWaitingForOpponent(false)
          setIsPlayerTurn(true)
        }
      }, 5000) // 5 second safety timeout
      
      return () => clearTimeout(safetyTimeout)
    }
  }, [loading, match, matchId, user])

  if (loading) {
    return (
      <div className="game-container">
        <Navigation />
        <div className="loading" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          color: 'var(--text-primary)',
          fontSize: '18px'
        }}>
          Loading game...
        </div>
      </div>
    )
  }

  // Always show the chess board, even if match data failed to load
  // Create a default match if none exists (for practice mode)
  // This ensures the board always renders, preventing blank screens on Vercel
  const displayMatch: Match = match || {
    id: matchId || 'practice',
    creatorId: user?.id || 'unknown',
    opponentId: null,
    entryFee: 0,
    status: 'started',
    creator: { name: user?.name || 'You' },
  };

  const entryFee = Number(displayMatch.entryFee)
  const { winnerPrize, platformProfit, totalPool } = calculatePrize(entryFee)
  const isFreePlay = entryFee === 0
  const hasComputerOpponent = isFreePlay && displayMatch.opponentId
  const opponentName = displayMatch.creatorId === user?.id 
    ? (hasComputerOpponent ? '🤖 Chess AI' : (displayMatch.opponent?.name || (isFreePlay ? 'Practice Mode (Play Alone)' : 'Waiting for opponent...')))
    : displayMatch.creator?.name || 'Unknown'

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
          
          {isFreePlay && !displayMatch.opponentId && (
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
                <span>⏳ {hasComputerOpponent ? '🤖 Computer\'s Turn' : (isFreePlay && !displayMatch.opponentId ? 'Switch Sides' : 'Opponent\'s Turn')} ({isWhiteTurn ? 'White' : 'Black'})</span>
              )}
            </div>
          )}
          
          {/* Always show chess board - especially for free matches */}
          <ChessBoard
            game={game}
            onMove={handleMove}
            isPlayerTurn={isFreePlay ? true : (isPlayerTurn && !waitingForOpponent)}
            playerColor={playerColor}
          />
          
          {waitingForOpponent && !isFreePlay && (
            <div className="waiting-note">
              <p>💡 <strong>Tip:</strong> You can practice moves on the board while waiting. The game will start when your opponent joins!</p>
            </div>
          )}
          
          {isFreePlay && !displayMatch.opponentId && (
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
              <span className={`status-badge ${displayMatch.status}`}>{displayMatch.status.toUpperCase()}</span>
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

