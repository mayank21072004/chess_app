// alert('hey are u working?')
// const {Chess} = require("chess.js");

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null; 
let playerRole = null;

const renderBoard = () => {


    const board = chess.board();
    boardElement.innerHTML = "";
    console.log(board);
    board.forEach((row, rowindex) => {
        row.forEach((square,squareindex) => {
            // console.log(square);
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex)%2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black",
                ); 
                pieceElement.innerText = getPieceUnicode(square);   
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("mouseenter" , (e) =>{
                    let possiblemoves = chess.moves({square: (String.fromCharCode(97 + squareindex) + (8 - rowindex)),verbose: true});
                    console.log(possiblemoves);
                    for(let i = 0; i < possiblemoves.length; i++){
                        const move = possiblemoves[i].to;
                        const targetSquare = move.slice(-2);
                        console.log(targetSquare);
                        const targetElement = document.querySelector(`.square[data-row='${8 - targetSquare[1]}'][data-col='${targetSquare.charCodeAt(0) - 97}']`);
                        console.log(targetElement);
                        targetElement.classList.add("highlight");
                    }
                })
                pieceElement.addEventListener("mouseleave" , (e) =>{
                    let possiblemoves = chess.moves({square: String.fromCharCode(97 + squareindex) + (8 - rowindex)});
                    // console.log(possiblemoves);
                    for(let i = 0; i < possiblemoves.length; i++){
                        const move = possiblemoves[i];
                        const targetSquare = move.slice(-2);
                        console.log(targetSquare);
                        const targetElement = document.querySelector(`.square[data-row='${8 - targetSquare[1]}'][data-col='${targetSquare.charCodeAt(0) - 97}']`);
                        console.log(targetElement);
                        targetElement.classList.remove("highlight");
                    }
                })


                pieceElement.addEventListener("dragstart", (e) => {
                    console.log("dragstart");
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowindex, col: squareindex};
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e) {
                e.preventDefault();
                console.log(draggedPiece);
                if(draggedPiece){
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    console.log(sourceSquare, targetSource);
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        }); 
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }

};

const handleMove = (source , target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }
    console.log(move);
    socket.emit("move", move);
};

const getPieceUnicode = (piece) =>{
    const unicodePieces = {
        K: '\u2654',
        Q: '\u2655',
        R: '\u2656',
        B: '\u2657',
        N: '\u2658',
        P: '\u2659',
        
        k: '\u265A',
        q: '\u265B',
        r: '\u265C',
        b: '\u265D',
        n: '\u265E',
        // p: '\u265F',
        p: '\u2659'
    }
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("gameOver", function () {
    console.log("Game Over");
    chess.clear();
    alert("Game Over . Please reload the page to play again.");
    console.log(chess.board());
    renderBoard();
});
socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});



renderBoard();