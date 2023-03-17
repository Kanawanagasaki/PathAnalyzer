var Cell = (function () {
    function Cell(x, y, grid) {
        this.IsCastle = false;
        this.IsRock = false;
        this.IsSpawner = false;
        this.G = Number.POSITIVE_INFINITY;
        this.PreviousCell = null;
        this._spawnTime = -Cell.SPAWN_INTERVAL;
        this.X = x;
        this.Y = y;
        this._grid = grid;
    }
    Cell.prototype.Draw = function (time, x, y, width, height) {
        if (this.IsSpawner && this.PreviousCell !== null && Cell.SPAWN_INTERVAL < time - this._spawnTime && !this._grid.IsEnemyOn(this.X, this.Y)) {
            this._grid.SpawnEnemy(this.X, this.Y);
            this._spawnTime = time;
        }
        push();
        translate(x, y);
        rect(1.5, 1.5, width - 3, height - 3, 4);
        if (this.PreviousCell) {
            push();
            strokeWeight(1);
            stroke("gold");
            fill("gold");
            if (this.PreviousCell.X < this.X)
                triangle(4, height / 2, 10, height / 2 - 4, 10, height / 2 + 4);
            if (this.X < this.PreviousCell.X)
                triangle(width - 4, height / 2, width - 10, height / 2 - 4, width - 10, height / 2 + 4);
            if (this.PreviousCell.Y < this.Y)
                triangle(width / 2, 4, width / 2 - 4, 10, width / 2 + 4, 10);
            if (this.Y < this.PreviousCell.Y)
                triangle(width / 2, height - 4, width / 2 - 4, height - 10, width / 2 + 4, height - 10);
            pop();
        }
        if (this.IsCastle)
            image(CASTLE_IMG, 2, 2, width - 4, height - 4);
        else if (this.IsRock)
            image(ROCK_IMG, 2, 2, width - 4, height - 4);
        else if (this.IsSpawner) {
            if (this.PreviousCell === null)
                image(HOUSE_DERELICT_IMG, 2, 2, width - 4, height - 4);
            else
                image(HOUSE_IMG, 2, 2, width - 4, height - 4);
        }
        pop();
    };
    Cell.prototype.GetKey = function () {
        return this.X + "-" + this.Y;
    };
    Cell.SPAWN_INTERVAL = 5000;
    return Cell;
}());
var Enemy = (function () {
    function Enemy(movingFrom, grid) {
        this.MovingTo = null;
        this._updateTime = 0;
        this._firstTimeDraw = true;
        this.MovingFrom = movingFrom;
        this._grid = grid;
    }
    Enemy.prototype.Draw = function (time, cellWidth, cellHeight) {
        if (this._firstTimeDraw) {
            this._updateTime = time;
            this._firstTimeDraw = false;
        }
        var delta = (time - this._updateTime) * Enemy.SPEED;
        if (this.MovingFrom.IsCastle) {
            this._grid.RemoveEnemy(this);
            return;
        }
        if (this.MovingFrom.IsRock)
            this.MovingFrom.IsRock = false;
        if (this.MovingTo === null) {
            this.MovingTo = this.MovingFrom.PreviousCell;
            this._updateTime = time;
        }
        else if (delta >= 1000) {
            this.MovingFrom = this.MovingTo;
            this.MovingTo = this.MovingFrom.PreviousCell;
            delta -= 1000;
            this._updateTime = time;
        }
        if (this.MovingTo === null) {
            push();
            translate(this.MovingFrom.X * cellWidth, this.MovingFrom.Y * cellHeight);
            image(ENEMY_IMG, 2, 2, cellWidth - 4, cellHeight - 4);
            pop();
            return;
        }
        var xFrom = this.MovingFrom.X * cellWidth;
        var yFrom = this.MovingFrom.Y * cellWidth;
        var xTo = this.MovingTo.X * cellWidth;
        var yTo = this.MovingTo.Y * cellWidth;
        var x = xFrom + (xTo - xFrom) * delta / 1000;
        var y = yFrom + (yTo - yFrom) * delta / 1000;
        push();
        translate(x, y);
        image(ENEMY_IMG, 2, 2, cellWidth - 4, cellHeight - 4);
        pop();
    };
    Enemy.SPEED = 2;
    return Enemy;
}());
var Grid = (function () {
    function Grid() {
        this.Columns = 24;
        this.Rows = 16;
        this._enemies = [];
        for (var iy = 0; iy < this.Rows; iy++) {
            this[iy] = {};
            for (var ix = 0; ix < this.Columns; ix++)
                this[iy][ix] = new Cell(ix, iy, this);
        }
        this.CastleX = Math.floor(this.Columns / 2);
        this.CastleY = Math.floor(this.Rows * .75);
        this.Clear();
    }
    Grid.prototype.Clear = function () {
        for (var iy = 0; iy < this.Rows; iy++) {
            for (var ix = 0; ix < this.Columns; ix++) {
                var cell = this.GetCell(ix, iy);
                cell.IsRock = false;
                cell.IsCastle = false;
                cell.IsSpawner = false;
            }
        }
        this._enemies = [];
        this.CastleX = Math.floor(this.Columns / 2);
        this.CastleY = Math.floor(this.Rows * .75);
        this.Reset();
        this.Analyze();
    };
    Grid.prototype.Reset = function () {
        var _a;
        for (var iy = 0; iy < this.Rows; iy++) {
            for (var ix = 0; ix < this.Columns; ix++) {
                var cell = this.GetCell(ix, iy);
                cell.G = Number.POSITIVE_INFINITY;
                cell.PreviousCell = null;
            }
        }
        this.SetCastle(this.CastleX, this.CastleY);
        var castleCell = this.GetCell(this.CastleX, this.CastleY);
        this._openSet = [castleCell];
        this._closedSet = (_a = {}, _a[castleCell.GetKey()] = castleCell, _a);
    };
    Grid.prototype.Analyze = function () {
        while (this._openSet.length > 0) {
            this._openSet.sort(function (a, b) { return a.G - b.G; });
            var current = this._openSet.shift();
            var neighbors = [
                this.GetCell(current.X + 1, current.Y),
                this.GetCell(current.X - 1, current.Y),
                this.GetCell(current.X, current.Y + 1),
                this.GetCell(current.X, current.Y - 1)
            ].filter(function (x) { return !x.IsRock; });
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var neighbor = neighbors_1[_i];
                var g = current.G + 1;
                var key_1 = neighbor.GetKey();
                if (!this._closedSet.hasOwnProperty(key_1) || g < this._closedSet[key_1].G) {
                    neighbor.G = g;
                    neighbor.PreviousCell = current;
                    this._openSet.push(neighbor);
                    this._closedSet[key_1] = neighbor;
                }
            }
        }
    };
    Grid.prototype.GetCell = function (x, y) {
        if (this.hasOwnProperty(y) && this[y].hasOwnProperty(x))
            return this[y][x];
        var cell = new Cell(x, y, this);
        cell.IsRock = true;
        return cell;
    };
    Grid.prototype.SetCastle = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        var cell = this.GetCell(x, y);
        if (cell.IsRock)
            return;
        this.GetCell(this.CastleX, this.CastleY).IsCastle = false;
        this.CastleX = x;
        this.CastleY = y;
        cell.G = 0;
        cell.PreviousCell = null;
        cell.IsCastle = true;
    };
    Grid.prototype.SetRock = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        var cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock || cell.IsSpawner)
            return;
        if (this.IsEnemyOn(x, y))
            return;
        cell.IsRock = true;
    };
    Grid.prototype.RemoveRock = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        this.GetCell(x, y).IsRock = false;
    };
    Grid.prototype.SpawnEnemy = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        if (this.IsEnemyOn(x, y))
            return;
        var cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock)
            return;
        this._enemies.push(new Enemy(cell, this));
    };
    Grid.prototype.IsEnemyOn = function (x, y) {
        return this._enemies.some(function (e) { return (e.MovingFrom.X == x && e.MovingFrom.Y == y) || (e.MovingTo && (e.MovingTo.X == x && e.MovingTo.Y == y)); });
    };
    Grid.prototype.RemoveEnemy = function (enemy) {
        this._enemies = this._enemies.filter(function (x) { return x !== enemy; });
    };
    Grid.prototype.SetSpawner = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        var cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock || cell.IsSpawner)
            return;
        if (cell.PreviousCell === null)
            return;
        cell.IsSpawner = true;
    };
    Grid.prototype.RemoveSpawner = function (x, y) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        this.GetCell(x, y).IsSpawner = false;
    };
    Grid.prototype.Draw = function (time, x, y, width, height) {
        var cellWidth = width / this.Columns;
        var cellHeight = height / this.Rows;
        push();
        translate(x, y);
        for (var iy = 0; iy < this.Rows; iy++)
            for (var ix = 0; ix < this.Columns; ix++)
                this[iy][ix].Draw(time, ix * cellWidth, iy * cellHeight, cellWidth, cellHeight);
        for (var _i = 0, _a = this._enemies; _i < _a.length; _i++) {
            var enemy = _a[_i];
            enemy.Draw(time, cellWidth, cellHeight);
        }
        pop();
    };
    return Grid;
}());
var ESelection;
(function (ESelection) {
    ESelection[ESelection["Castle"] = 0] = "Castle";
    ESelection[ESelection["Rock"] = 1] = "Rock";
    ESelection[ESelection["Enemy"] = 2] = "Enemy";
    ESelection[ESelection["Spawner"] = 3] = "Spawner";
})(ESelection || (ESelection = {}));
var CASTLE_IMG, ROCK_IMG, ENEMY_IMG, HOUSE_IMG, HOUSE_DERELICT_IMG;
var grid, gridWidth, gridHeight;
var castleButton, rockButton, enemyButton, spawnerButton, clearButton;
var selection = ESelection.Enemy;
var prevCell = { x: -1, y: -1 };
var isMousePressedOnEmpty = true;
function setup() {
    CASTLE_IMG = loadImage("assets/castle.png");
    ROCK_IMG = loadImage("assets/rock.png");
    ENEMY_IMG = loadImage("assets/enemy.png");
    HOUSE_IMG = loadImage("assets/house.png");
    HOUSE_DERELICT_IMG = loadImage("assets/derelict-house.png");
    grid = new Grid();
    var rendered = createCanvas(windowWidth, windowHeight);
    rendered.style("font-family", "emoji");
    noFill();
    strokeWeight(2);
    stroke("#A5A5A5");
    textAlign("center", "center");
    textFont("Inspiration");
    castleButton = makeButton("castle");
    castleButton.mouseClicked(function () { return selection = ESelection.Castle; });
    rockButton = makeButton("rock");
    rockButton.mouseClicked(function () { return selection = ESelection.Rock; });
    enemyButton = makeButton("enemy");
    enemyButton.mouseClicked(function () { return selection = ESelection.Enemy; });
    spawnerButton = makeButton("house");
    spawnerButton.mouseClicked(function () { return selection = ESelection.Spawner; });
    clearButton = makeButton("refresh");
    clearButton.mouseClicked(function () {
        grid.Clear();
        grid.Analyze();
    });
    onResize();
}
function makeButton(icon) {
    var btn = createButton("<img src='assets/" + icon + ".png' style='height: 24px;'/>");
    btn.style("padding", "2px");
    btn.style("cursor", "pointer");
    return btn;
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    onResize();
}
function onResize() {
    var windowResizedWidth = windowWidth - 12;
    var windowResizedHeight = windowHeight - 48;
    var windowRatio = windowResizedWidth / windowResizedHeight;
    var gridRatio = grid.Columns / grid.Rows;
    if (gridRatio < windowRatio) {
        gridHeight = windowResizedHeight;
        gridWidth = windowResizedWidth * gridRatio / windowRatio;
    }
    else {
        gridWidth = windowResizedWidth;
        gridHeight = windowResizedHeight * windowRatio / gridRatio;
    }
    textSize(gridWidth / grid.Columns * .8);
    castleButton.position(windowWidth / 2 - gridWidth / 2, (windowHeight - 36) / 2 + gridHeight / 2 + 6);
    rockButton.position(windowWidth / 2 - gridWidth / 2 + 38, (windowHeight - 36) / 2 + gridHeight / 2 + 6);
    enemyButton.position(windowWidth / 2 - gridWidth / 2 + 76, (windowHeight - 36) / 2 + gridHeight / 2 + 6);
    spawnerButton.position(windowWidth / 2 - gridWidth / 2 + 114, (windowHeight - 36) / 2 + gridHeight / 2 + 6);
    clearButton.position(windowWidth / 2 - gridWidth / 2 + 152, (windowHeight - 36) / 2 + gridHeight / 2 + 6);
}
function draw() {
    background(0);
    grid.Draw(performance.now(), windowWidth / 2 - gridWidth / 2, (windowHeight - 36) / 2 - gridHeight / 2, gridWidth, gridHeight);
}
function mousePressed() {
    var cellCoords = getMouseCell();
    var cell = grid.GetCell(cellCoords.x, cellCoords.y);
    if (selection == ESelection.Rock)
        isMousePressedOnEmpty = !cell.IsCastle && !cell.IsRock;
    else if (selection == ESelection.Spawner)
        isMousePressedOnEmpty = !cell.IsSpawner;
    processMouse();
}
function mouseDragged() {
    processMouse();
}
function mouseReleased() {
    prevCell = { x: -1, y: -1 };
}
function processMouse() {
    var cellCoords = getMouseCell();
    if (prevCell.x == cellCoords.x && prevCell.y == cellCoords.y)
        return;
    prevCell = cellCoords;
    switch (selection) {
        case ESelection.Castle:
            grid.SetCastle(cellCoords.x, cellCoords.y);
            grid.Reset();
            grid.Analyze();
            break;
        case ESelection.Rock:
            if (isMousePressedOnEmpty)
                grid.SetRock(cellCoords.x, cellCoords.y);
            else
                grid.RemoveRock(cellCoords.x, cellCoords.y);
            grid.Reset();
            grid.Analyze();
            break;
        case ESelection.Enemy:
            grid.SpawnEnemy(cellCoords.x, cellCoords.y);
            break;
        case ESelection.Spawner:
            if (isMousePressedOnEmpty)
                grid.SetSpawner(cellCoords.x, cellCoords.y);
            else
                grid.RemoveSpawner(cellCoords.x, cellCoords.y);
            break;
    }
    return false;
}
function getMouseCell() {
    var gridX = mouseX - (windowWidth / 2 - gridWidth / 2);
    var gridY = mouseY - ((windowHeight - 36) / 2 - gridHeight / 2);
    var cellX = Math.floor(gridX / gridWidth * grid.Columns);
    var cellY = Math.floor(gridY / gridHeight * grid.Rows);
    return { x: cellX, y: cellY };
}
//# sourceMappingURL=build.js.map