const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require("chess.js");
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("chesi",{title: "Chess Game"});
});

app.get("/chess", (req, res) => {
    res.render("index",{title: "Chess Game"});
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    if(!players.white){
        console.log("white player connected");
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        console.log("black player connected");
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole");
        console.log("spectator connected");
    }

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            console.log("white player disconnected");
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            console.log("black player disconnected");
            delete players.black;
        }
    });

    uniquesocket.on("move",(move) =>{
        try {
            console.log(move);
            if(chess.turn() == 'w' && uniquesocket.id !== players.white) {
                console.log("white player trying to move black piece");
                return;
            }
            if(chess.turn() == 'b' && uniquesocket.id !== players.black) {
                console.log("black player trying to move white piece");
                return;
            }

            // console.log("yahan tak aa gaye")

            // console.log("Current Player: ", currentPlayer);
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                if(chess.isCheckmate()){
                    io.emit("gameOver", "Checkmate");
                }
                else if(chess.isDraw()){
                    io.emit("gameOver", "Draw");
                }
                else if(chess.isStalemate()){
                    io.emit("gameOver", "Stalemate");
                }
                else if(chess.isThreefoldRepetition()){
                    io.emit("gameOver", "Threefold Repetition");
                }
                else if(chess.inCheck()){
                    io.emit("check", "Check");
                }
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else{
                console.log("Invalid Move");
                uniquesocket.emit("invalidMove",move);
            }

        } catch (error) {
            // console.log(error);
            uniquesocket.emit("invalidMove",move);
        }
    })
})

server.listen(3000,function () {
    console.log('Server is running on port 3000');
});
