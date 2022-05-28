const socket = io();
const cells = document.querySelectorAll('[data-cell]');

var symbol = 'x';
var roomid;
var turn = 1;
var moves = 0;
var playagain = 0;
var username;
var board = [['0', '0', '0'], ['0', '0', '0'], ['0', '0', '0']];

document.getElementById('submitname').addEventListener('click', (e) => {
    e.preventDefault();

    username = document.getElementById('nameinput').value;
    document.getElementById('dform').style.display = 'none';
    setDialogActive(false);

    socket.emit('usernameset', username);
});

document.getElementById('joinbtn').addEventListener('click', (e) => {
    e.preventDefault();

    let id = parseInt(document.getElementById('roomidinput').value);
    if (id > 0 && id != roomid) {
        socket.emit('join-room', id, username, (res, hostname) => {
            if (res) {
                roomid = id;
                document.getElementById('status').innerText = `You joined ${hostname}'s room`
                document.getElementById('roomid').innerText = `Current room: ${roomid}`;
                symbol = 'o';
                turn *= -1;
                init();
            }
            else {
                alert('Invalid or full room');
            }
        });
    }
});

socket.on('connect', () => {
    joinNewRoom();
});

socket.on('movetoclient', data => {
    board = data;
    turn *= -1;
    setTurn(turn);
    updateDivs();
    if (checkWin()) {
        socket.emit('win', socket.id);
        won();
    }
});

socket.on('lost', a => {
    lost();
});

socket.on('joined', (user) => {
    document.getElementById('status').innerText = `${user} joined`;
    init();
});

socket.on('playagaincancelcon', () => {
    setDialogActive(false);
    reset();
});

socket.on('playagainconfirm', () => {
    playagain++;
    if (playagain > 1) {
        playAgain();
    }
});

function joinNewRoom(){
    roomid = Math.floor(Math.random() * (600000 - 100000) + 100000);
    socket.emit('join', roomid);
    document.getElementById('roomid').innerText = `Current room: ${roomid}`;
}

function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handler);
    });
    document.getElementById('iform').style.display = 'none';
    setTurn(turn);
}

function playAgain() {
    turn *= -1;
    symbol = symbol == 'x' ? 'o' : 'x';
    resetVariables();
    setTurn(turn);
    updateDivs();
}

function resetVariables() {
    moves = 0;
    playagain = 0;
    board = [['0', '0', '0'], ['0', '0', '0'], ['0', '0', '0']];
}

function reset() {
    turn = 1;
    symbol = 'x';
    document.getElementById('iform').style.display = 'flex';
    joinNewRoom();
    cells.forEach(cell => {
        cell.removeEventListener('click', handler);
    });
    document.getElementById('status').innerText = 'Waiting for player';
    document.getElementById('turn').innerText = '';
    resetVariables();
    updateDivs();
}

function setDialogActive(active) {
    if (active) document.getElementById('dialog').classList.add('dialog-active');
    else document.getElementById('dialog').classList.remove('dialog-active');
}

function won() {
    cellEnable(-1);
    setDialogActive(true);
    document.getElementById('alert-container').style.display = 'flex';
    document.getElementById('message').innerText = 'You won! Do you want to play again?';
    playAgainRequest();
}

function lost() {
    cellEnable(-1);
    setDialogActive(true);
    document.getElementById('alert-container').style.display = 'flex';
    document.getElementById('message').innerText = 'You lost! Do you want to play';
    playAgainRequest();
}

function playAgainRequest() {
    document.getElementById('yesbtn').addEventListener('click', () => {
        socket.emit('playagainrequest');
        document.getElementById('turn').innerText = 'Replay 1/2';
        playagain++;
        if (playagain > 1) {
            playAgain();
        }
        setDialogActive(false);
    });
    document.getElementById('nobtn').addEventListener('click', () => {
        socket.emit('playagaincancel');

        setDialogActive(false);
        reset();
    });
}

function handler(evt) {
    let curCell = evt.target;

    let n = Array.from(curCell.parentNode.children).indexOf(curCell);
    board[Math.floor(n / 3)][n % 3] = symbol;
    updateDivs();

    socket.emit('movetoserver', board);
}

function updateDivs() {
    for (let i = 0; i < 9; i++) {
        let s = board[Math.floor(i / 3)][i % 3];
        if (s == 'x' || s == 'o')
            cells[i].classList.add(s);
        else {
            cells[i].classList.remove('x');
            cells[i].classList.remove('o');
        }
    }
}

function setTurn(turn) {
    moves++;
    cellEnable(turn);
    if (moves / 2 >= 4) {
        alert('Tie');
        cellEnable(-1);
    }
    document.getElementById('turn').innerText = turn == 1 ? 'Your turn' : 'Opponent`s turn';
}

function cellEnable(status) {
    if (status == -1) {
        cells.forEach(cell => {
            cell.classList.add('disabledcell');
        });
    }
    else {
        cells.forEach(cell => {
            cell.classList.remove('disabledcell');
        });
    }
}

function checkWin() {
    if (moves / 2 >= 3) {
        for (let i = 0; i < 3; i++) {
            if (board[i][0] == symbol && board[i][1] == symbol && board[i][2] == symbol)
                return true;
            if (board[0][i] == symbol && board[1][i] == symbol && board[2][i] == symbol)
                return true;
        }
        if (board[0][0] == symbol && board[1][1] == symbol && board[2][2] == symbol)
            return true;
        if (board[2][0] == symbol && board[1][1] == symbol && board[0][2] == symbol)
            return true;
    }
    return false;
}