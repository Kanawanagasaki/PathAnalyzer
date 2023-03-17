class Cell {
    public static readonly SPAWN_INTERVAL = 5000;

    public X: number;
    public Y: number;
    public IsCastle: boolean = false;
    public IsRock: boolean = false;
    public IsSpawner: boolean = false;

    public G: number = Number.POSITIVE_INFINITY;
    public PreviousCell: Cell | null = null;

    private _grid: Grid;
    private _spawnTime: number = -Cell.SPAWN_INTERVAL;

    public constructor(x: number, y: number, grid: Grid) {
        this.X = x;
        this.Y = y;

        this._grid = grid;
    }

    public Draw(time: number, x: number, y: number, width: number, height: number) {

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
    }

    public GetKey() {
        return `${this.X}-${this.Y}`;
    }
}