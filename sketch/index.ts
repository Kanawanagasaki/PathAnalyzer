enum ESelection {
    Castle, Rock, Enemy, Spawner
}

var CASTLE_IMG: p5.Image, ROCK_IMG: p5.Image, ENEMY_IMG: p5.Image, HOUSE_IMG: p5.Image, HOUSE_DERELICT_IMG: p5.Image;

var grid: Grid, gridWidth: number, gridHeight: number;
var castleButton: p5.Element, rockButton: p5.Element, enemyButton: p5.Element, spawnerButton: p5.Element, clearButton: p5.Element;
var selection: ESelection = ESelection.Enemy;
var prevCell: { x: number, y: number } = { x: -1, y: -1 };
var isMousePressedOnEmpty = true;

function setup() {
    CASTLE_IMG = loadImage("assets/castle.png");
    ROCK_IMG = loadImage("assets/rock.png");
    ENEMY_IMG = loadImage("assets/enemy.png");
    HOUSE_IMG = loadImage("assets/house.png");
    HOUSE_DERELICT_IMG = loadImage("assets/derelict-house.png");

    grid = new Grid();

    const rendered = createCanvas(windowWidth, windowHeight);
    rendered.style("font-family", "emoji");

    noFill();
    strokeWeight(2);
    stroke("#A5A5A5");
    textAlign("center", "center");
    textFont("Inspiration");

    castleButton = makeButton("castle");
    castleButton.mouseClicked(() => selection = ESelection.Castle);

    rockButton = makeButton("rock");
    rockButton.mouseClicked(() => selection = ESelection.Rock);

    enemyButton = makeButton("enemy");
    enemyButton.mouseClicked(() => selection = ESelection.Enemy);

    spawnerButton = makeButton("house");
    spawnerButton.mouseClicked(() => selection = ESelection.Spawner);

    clearButton = makeButton("refresh");
    clearButton.mouseClicked(() => {
        grid.Clear();
        grid.Analyze();
    });

    onResize();
}

function makeButton(icon: string) {
    const btn = createButton(`<img src='assets/${icon}.png' style='height: 24px;'/>`);
    btn.style("padding", "2px");
    btn.style("cursor", "pointer");
    return btn;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    onResize();
}

function onResize() {
    const windowResizedWidth = windowWidth - 12;
    const windowResizedHeight = windowHeight - 48;
    const windowRatio = windowResizedWidth / windowResizedHeight;
    const gridRatio = grid.Columns / grid.Rows;
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
    const cellCoords = getMouseCell();
    const cell = grid.GetCell(cellCoords.x, cellCoords.y);
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
    const cellCoords = getMouseCell();
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
    const gridX = mouseX - (windowWidth / 2 - gridWidth / 2);
    const gridY = mouseY - ((windowHeight - 36) / 2 - gridHeight / 2);
    const cellX = Math.floor(gridX / gridWidth * grid.Columns);
    const cellY = Math.floor(gridY / gridHeight * grid.Rows);
    return { x: cellX, y: cellY };
}
