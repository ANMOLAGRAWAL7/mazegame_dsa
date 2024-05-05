let maze = [];
let visited=[];
let rows;
let cols;
let start_row;
let start_col;
let end_row;
let end_col;
const Terrain = {
    Empty: 0,
    Wall: 1,
    Goal: 2,
    Crumb: 3
};
function allocVisited() {
    if (rows <= 0 || cols <= 0) {
        console.error('Invalid maze dimensions:', rows, cols);
        return;
    }
    visited = new Array(rows).fill().map(() => new Array(cols).fill(0));
}
function getMaze(fileName) {
    fetch(fileName)
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            rows = parseInt(lines[0]);
            cols = parseInt(lines[1]);

            maze = lines.slice(2).map(line => line.split(''));

            // Find start and end positions
            for (let i = 0; i < rows; ++i) {
                for (let j = 0; j < cols; ++j) {
                    if (maze[i][j] === 's') {
                        start_row = i;
                        start_col = j;
                    }
                    if (maze[i][j] === 'g') {
                        end_row = i;
                        end_col = j;
                    }
                }
            }

            drawMaze();
            initVisited();
        })
        .catch(error => {
            console.error('Error fetching maze:', error);
        });
}

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

function drawMaze() {
    const cellSize = Math.min(canvas.width / cols, canvas.height / rows);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (maze[i][j] === '+') {
                ctx.fillStyle = 'black';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            } else if (maze[i][j] === 's') {
                ctx.fillStyle = 'green';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            } else if (maze[i][j] === 'g') {
                ctx.fillStyle = 'red';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }
}
function initVisited() {
    allocVisited();

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (maze[i][j] === '+') {
                visited[i][j] = Terrain.Wall;
            } else if (maze[i][j] === 'g') {
                visited[i][j] = Terrain.Goal;
            } else {
                visited[i][j] = Terrain.Empty;
            }
        }
    }
}
function addCrumbs() {
    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (maze[i][j] !== 's' && visited[i][j] === Terrain.Crumb) {
                maze[i][j] = '.';
            }
        }
    }
}
function drawPath() {
    ctx.fillStyle = 'blue';
    const cellSize = Math.min(canvas.width / cols, canvas.height / rows);
    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (maze[i][j] === '.'){
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }
}
function clearPath() {
    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (maze[i][j] === '.') {
                maze[i][j] = ' '; // Restore the cell to its original state
            }
        }
    }
}
function dfs(row, col) {
    if (visited === undefined || visited[row] === undefined || visited[row][col] === undefined) {
        console.error('Invalid visited array or indices:', visited, row, col);
        return false;
    }

    let current = visited[row][col];

    if (current === Terrain.Goal) {
        return true;
    }

    if (current === Terrain.Empty) {
        visited[row][col] = Terrain.Crumb;

        if (dfs(row, col - 1) || dfs(row + 1, col) || dfs(row, col + 1) || dfs(row - 1, col)) {
            visited[row][col] = Terrain.Crumb;
            return true;
        }
        else{
            visited[row][col]=Terrain.Empty;
        }
    }

    return false;
}
function bfs(startRow, startCol) {
    const queue = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
        const current = queue.shift();
        const row = current.row;
        const col = current.col;

        if (row === end_row && col === end_col) {
            return true; // Goal reached
        }

        if (maze[row][col] === '+') {
            continue; // Skip walls
        }

        visited[row][col] = Terrain.Crumb; // Mark as visited

        // Check neighboring cells
        const neighbors = getNeighbors(row, col);
        for (const neighbor of neighbors) {
            const newRow = neighbor.row;
            const newCol = neighbor.col;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && visited[newRow][newCol] === Terrain.Empty) {
                queue.push({ row: newRow, col: newCol });
                visited[newRow][newCol] = Terrain.Crumb; // Mark neighbor as visited
            }
        }
    }

    return false; // Goal not reachable
}

function getNeighbors(row, col) {
    const deltas = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];
    const neighbors = [];

    for (const delta of deltas) {
        const newRow = row + delta.row;
        const newCol = col + delta.col;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }

    return neighbors;
}

class Node {
    constructor(row, col, g = 0, h = 0) {
        this.row = row;
        this.col = col;
        this.g = g; // Cost from start node to current node
        this.h = h; // Heuristic (estimated cost from current node to goal node)
    }

    get f() {
        return this.g + this.h; // Total cost (f = g + h)
    }
}
function aStar(startRow, startCol) {
    const openSet = [new Node(startRow, startCol)];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f); // Sort by total cost

        const current = openSet.shift();

        if (maze[current.row][current.col] === 'g') {
            return true; // Goal reached
        }

        closedSet.add(`${current.row},${current.col}`);

        const neighbors = getNeighbors(current.row, current.col);
        for (const neighbor of neighbors) {
            const neighborNode = new Node(neighbor.row, neighbor.col);
            if (!closedSet.has(`${neighborNode.row},${neighborNode.col}`) && maze[neighborNode.row][neighborNode.col] !== '+') {
                const tentativeG = current.g + 1; // Assuming each step has a cost of 1

                // Add neighbor to open set if it's not already in it or if the new path is better
                const existingOpenNode = openSet.find(node => node.row === neighborNode.row && node.col === neighborNode.col);
                if (!existingOpenNode || tentativeG < existingOpenNode.g) {
                    neighborNode.g = tentativeG;
                    neighborNode.h = heuristic(neighborNode.row, neighborNode.col);
                    openSet.push(neighborNode);
                }
            }
        }
    }

    return false; // Goal not reachable
}

function heuristic(row, col) {
    // Simple Manhattan distance heuristic
    return Math.abs(row - end_row) + Math.abs(col - end_col);
}

getMaze("/mazeproject/src/maze.txt");
document.getElementById('solveDFSButton').addEventListener('click', () => {
    const startTime = performance.now();
    if (dfs(start_row, start_col)) {
        addCrumbs();
        drawPath();
    }
    const endTime = performance.now();
    const timeTaken = Math.round((endTime - startTime) * 10000) / 10000;
    document.getElementById('dfsTime').textContent = `Time taken by DFS: ${timeTaken} milliseconds`;
    document.getElementById('dfsTime').style.display = 'block';
});
document.getElementById('solveBFSButton').addEventListener('click', () => {
    const startTime = performance.now();
    if (dfs(start_row, start_col)) {
        addCrumbs();
        drawPath();
    }
    const endTime = performance.now();
    const timeTaken = Math.round((endTime - startTime) * 10000) / 10000;
    document.getElementById('bfsTime').style.display = 'block';
    document.getElementById('bfsTime').textContent = `Time taken by BFS: ${timeTaken} milliseconds`;
    
});

document.getElementById('solveAStarButton').addEventListener('click', () => {
    const startTime = performance.now();
    if (dfs(start_row, start_col)) {
        addCrumbs();
        drawPath();
    }
    const endTime = performance.now();
    const timeTaken = Math.round((endTime - startTime) * 10000) / 10000;
    document.getElementById('aStarTime').textContent = `Time taken by A*: ${timeTaken} milliseconds`;
    document.getElementById('aStarTime').style.display = 'block';
});
document.getElementById('reset').addEventListener('click', () => {
    clearPath();
    drawMaze();
    initVisited();
    resetSolveTimes();
});
function resetSolveTimes() {
    dfsTime = 0;
    bfsTime = 0;
    aStarTime = 0;
    timeTaken=0;
    document.getElementById('dfsTime').style.display='none';
    document.getElementById('bfsTime').style.display='none';
    document.getElementById('aStarTime').style.display='none';
}
