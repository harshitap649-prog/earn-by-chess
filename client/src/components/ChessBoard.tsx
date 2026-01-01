import { useEffect, useState, useRef } from 'react'
import { Chess } from 'chess.js'
import './ChessBoard.css'

interface ChessBoardProps {
  game: Chess
  onMove: (move: { from: string; to: string; promotion?: string }) => void
  isPlayerTurn: boolean
  playerColor: 'white' | 'black'
}

export default function ChessBoard({ game, onMove, isPlayerTurn, playerColor }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [boardRotation, setBoardRotation] = useState<number>(0)
  const boardRef = useRef<HTMLDivElement>(null)

  const files = 'abcdefgh'.split('')
  const ranks = playerColor === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

  // Update last move when game history changes
  useEffect(() => {
    const history = game.history({ verbose: true })
    if (history.length > 0) {
      const last = history[history.length - 1]
      setLastMove({ from: last.from, to: last.to })
    } else {
      setLastMove(null)
    }
  }, [game])

  const getPieceSymbol = (piece: any) => {
    if (!piece) return ''
    const pieceType = piece.type.toLowerCase()
    const isWhite = piece.color === 'w'
    
    // Using better Unicode chess symbols for clearer display
    const symbols: { [key: string]: { white: string; black: string } } = {
      'p': { white: '♙', black: '♟' },
      'r': { white: '♖', black: '♜' },
      'n': { white: '♘', black: '♞' },
      'b': { white: '♗', black: '♝' },
      'q': { white: '♕', black: '♛' },
      'k': { white: '♔', black: '♚' }
    }
    
    return symbols[pieceType]?.[isWhite ? 'white' : 'black'] || ''
  }

  const getSquareColor = (file: string, rank: number) => {
    const fileIndex = files.indexOf(file)
    return (fileIndex + rank) % 2 === 0 ? 'light' : 'dark'
  }

  const handleSquareClick = (square: string) => {
    if (!isPlayerTurn) {
      return
    }

    const piece = game.get(square as any)
    const currentTurn = game.turn()
    const isOwnPiece = piece && piece.color === (playerColor === 'white' ? 'w' : 'b')
    const isCurrentPlayerTurn = (currentTurn === 'w' && playerColor === 'white') || 
                                 (currentTurn === 'b' && playerColor === 'black')

    if (!isCurrentPlayerTurn) {
      return
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null)
        setPossibleMoves([])
      } else {
        // Check if this is a valid move
        const isValidMove = possibleMoves.includes(square)
        
        if (isValidMove) {
          // Make the move
          try {
            // Create a temporary game to validate the move
            const tempGame = new Chess(game.fen())
            const move = tempGame.move({
              from: selectedSquare as any,
              to: square as any,
              promotion: 'q' // Auto-promote to queen
            })
            
            if (move) {
              onMove({ 
                from: selectedSquare, 
                to: square,
                promotion: move.promotion || 'q'
              })
              setSelectedSquare(null)
              setPossibleMoves([])
            } else {
              // Invalid move, try selecting new piece
              if (isOwnPiece) {
                setSelectedSquare(square)
                updatePossibleMoves(square)
              } else {
                setSelectedSquare(null)
                setPossibleMoves([])
              }
            }
          } catch (e) {
            // Invalid move
            if (isOwnPiece) {
              setSelectedSquare(square)
              updatePossibleMoves(square)
            } else {
              setSelectedSquare(null)
              setPossibleMoves([])
            }
          }
        } else {
          // Not a valid move, try selecting new piece
          if (isOwnPiece) {
            setSelectedSquare(square)
            updatePossibleMoves(square)
          } else {
            setSelectedSquare(null)
            setPossibleMoves([])
          }
        }
      }
    } else if (isOwnPiece && isCurrentPlayerTurn) {
      // Select piece
      setSelectedSquare(square)
      updatePossibleMoves(square)
    }
  }

  const updatePossibleMoves = (square: string) => {
    try {
      const moves = game.moves({ square: square as any, verbose: true })
      const validMoves = moves
        .map((m: any) => {
          // Validate each move
          try {
            const tempGame = new Chess(game.fen())
            const move = tempGame.move({
              from: m.from,
              to: m.to,
              promotion: m.promotion || 'q'
            })
            return move ? m.to : null
          } catch {
            return null
          }
        })
        .filter((to: string | null) => to !== null) as string[]
      
      setPossibleMoves(validMoves)
    } catch (e) {
      setPossibleMoves([])
    }
  }

  // Clear selection when it's not player's turn
  useEffect(() => {
    if (!isPlayerTurn) {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }, [isPlayerTurn])

  const handleRotate = (degrees: number) => {
    setBoardRotation((prev) => (prev + degrees) % 360)
  }

  const handleFlip = () => {
    setBoardRotation((prev) => (prev + 180) % 360)
  }

  return (
    <div className="chess-board-container" ref={boardRef}>
      {/* Board Controls */}
      <div className="board-controls">
        <button 
          className="board-control-btn" 
          onClick={handleFlip}
          title="Flip Board (180°)"
        >
          🔄 Flip
        </button>
        <button 
          className="board-control-btn" 
          onClick={() => handleRotate(90)}
          title="Rotate 90°"
        >
          ↻ Rotate
        </button>
      </div>

      {/* File labels (a-h) */}
      <div className="file-labels">
        {files.map(file => (
          <span key={file} className="file-label">{file}</span>
        ))}
      </div>
      
      <div className="board-wrapper">
        {/* Rank labels (1-8) */}
        <div className="rank-labels">
          {ranks.map(rank => (
            <span key={rank} className="rank-label">{rank}</span>
          ))}
        </div>

        <div 
          className={`chess-board ${playerColor === 'black' ? 'flipped' : ''}`}
          style={{ transform: `rotate(${boardRotation}deg)` }}
        >
          {ranks.map((rank) => (
            <div key={rank} className="rank">
              {files.map((file) => {
                const square = `${file}${rank}`
                const piece = game.get(square as any)
                const color = getSquareColor(file, rank)
                const isSelected = selectedSquare === square
                const isPossibleMove = possibleMoves.includes(square)
                const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)
                // Check if this square contains the king that is in check
                const isCheck = piece?.type === 'k' && 
                               piece.color === game.turn() &&
                               game.isCheck()

                return (
                  <div
                    key={square}
                    className={`square ${color} ${isSelected ? 'selected' : ''} ${isPossibleMove ? 'possible-move' : ''} ${isCheck ? 'check' : ''} ${isLastMove ? 'last-move' : ''}`}
                    onClick={() => handleSquareClick(square)}
                    title={square}
                  >
                    {piece && (
                      <span className={`piece ${piece.color} ${isSelected ? 'selected-piece' : ''}`}>
                        {getPieceSymbol(piece)}
                      </span>
                    )}
                    {isPossibleMove && !piece && <div className="move-indicator" />}
                    {isPossibleMove && piece && <div className="capture-indicator" />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Rank labels (1-8) - right side */}
        <div className="rank-labels">
          {ranks.map(rank => (
            <span key={rank} className="rank-label">{rank}</span>
          ))}
        </div>
      </div>

      {/* File labels (a-h) - bottom */}
      <div className="file-labels">
        {files.map(file => (
          <span key={file} className="file-label">{file}</span>
        ))}
      </div>
    </div>
  )
}

