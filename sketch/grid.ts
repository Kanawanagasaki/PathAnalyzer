class Grid {
    [row: number]: { [column: number]: Cell };

    public readonly Columns: number = 24;
    public readonly Rows: number = 16;

    public CastleX: number;
    public CastleY: number;

    private _enemies: Enemy[] = [];
    private _openSet: Cell[];
    private _closedSet: Record<string, Cell>;

    public constructor() {
        for (let iy = 0; iy < this.Rows; iy++) {
            this[iy] = {};
            for (let ix = 0; ix < this.Columns; ix++)
                this[iy][ix] = new Cell(ix, iy, this);
        }

        this.CastleX = Math.floor(this.Columns / 2);
        this.CastleY = Math.floor(this.Rows * .75);
        this.Clear();
    }

    public Clear() {
        for (let iy = 0; iy < this.Rows; iy++) {
            for (let ix = 0; ix < this.Columns; ix++) {
                const cell = this.GetCell(ix, iy);
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
    }

    public Reset() {
        for (let iy = 0; iy < this.Rows; iy++) {
            for (let ix = 0; ix < this.Columns; ix++) {
                const cell = this.GetCell(ix, iy);
                cell.G = Number.POSITIVE_INFINITY;
                cell.PreviousCell = null;
            }
        }
        this.SetCastle(this.CastleX, this.CastleY);
        const castleCell = this.GetCell(this.CastleX, this.CastleY);
        this._openSet = [castleCell];
        this._closedSet = { [castleCell.GetKey()]: castleCell };
    }

    public Analyze() {
        while (this._openSet.length > 0) {
            this._openSet.sort((a, b) => a.G - b.G);
            const current = this._openSet.shift();
            const neighbors = [
                this.GetCell(current.X + 1, current.Y),
                this.GetCell(current.X - 1, current.Y),
                this.GetCell(current.X, current.Y + 1),
                this.GetCell(current.X, current.Y - 1)
            ].filter(x => !x.IsRock);
            for (const neighbor of neighbors) {
                const g = current.G + 1;
                const key = neighbor.GetKey();
                if (!this._closedSet.hasOwnProperty(key) || g < this._closedSet[key].G) {
                    neighbor.G = g;
                    neighbor.PreviousCell = current;
                    this._openSet.push(neighbor);
                    this._closedSet[key] = neighbor;
                }
            }
        }
    }

    public GetCell(x: number, y: number) {
        if (this.hasOwnProperty(y) && this[y].hasOwnProperty(x))
            return this[y][x];
        const cell = new Cell(x, y, this);
        cell.IsRock = true;
        return cell;
    }

    public SetCastle(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;

        const cell = this.GetCell(x, y);
        if (cell.IsRock)
            return;

        this.GetCell(this.CastleX, this.CastleY).IsCastle = false;

        this.CastleX = x;
        this.CastleY = y;

        cell.G = 0;
        cell.PreviousCell = null;
        cell.IsCastle = true;
    }

    public SetRock(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        const cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock || cell.IsSpawner)
            return;
        if (this.IsEnemyOn(x, y))
            return;
        cell.IsRock = true;
    }

    public RemoveRock(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        this.GetCell(x, y).IsRock = false;
    }

    public SpawnEnemy(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        if (this.IsEnemyOn(x, y))
            return;
        const cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock)
            return;
        this._enemies.push(new Enemy(cell, this));
    }

    public IsEnemyOn(x: number, y: number) {
        return this._enemies.some(e => (e.MovingFrom.X == x && e.MovingFrom.Y == y) || (e.MovingTo && (e.MovingTo.X == x && e.MovingTo.Y == y)));
    }

    public RemoveEnemy(enemy: Enemy) {
        this._enemies = this._enemies.filter(x => x !== enemy);
    }

    public SetSpawner(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        const cell = this.GetCell(x, y);
        if (cell.IsCastle || cell.IsRock || cell.IsSpawner)
            return;
        if (cell.PreviousCell === null)
            return;
        cell.IsSpawner = true;
    }

    public RemoveSpawner(x: number, y: number) {
        if (x < 0 || x >= this.Columns || y < 0 || y >= this.Rows)
            return;
        this.GetCell(x, y).IsSpawner = false;
    }

    public Draw(time: number, x: number, y: number, width: number, height: number) {

        const cellWidth = width / this.Columns;
        const cellHeight = height / this.Rows;

        push();
        translate(x, y);

        for (let iy = 0; iy < this.Rows; iy++)
            for (let ix = 0; ix < this.Columns; ix++)
                this[iy][ix].Draw(time, ix * cellWidth, iy * cellHeight, cellWidth, cellHeight);

        for (const enemy of this._enemies)
            enemy.Draw(time, cellWidth, cellHeight);
        pop();
    }
}