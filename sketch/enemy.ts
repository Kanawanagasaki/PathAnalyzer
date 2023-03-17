class Enemy {
    public static readonly SPEED = 2;

    public MovingFrom: Cell;
    public MovingTo: Cell | null = null;

    private _grid: Grid;
    private _updateTime: number = 0;
    private _firstTimeDraw = true;

    public constructor(movingFrom: Cell, grid: Grid) {
        this.MovingFrom = movingFrom;
        this._grid = grid;
    }

    public Draw(time: number, cellWidth: number, cellHeight: number) {
        if (this._firstTimeDraw) {
            this._updateTime = time;
            this._firstTimeDraw = false;
        }


        let delta = (time - this._updateTime) * Enemy.SPEED;

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

        const xFrom = this.MovingFrom.X * cellWidth;
        const yFrom = this.MovingFrom.Y * cellWidth;
        const xTo = this.MovingTo.X * cellWidth;
        const yTo = this.MovingTo.Y * cellWidth;
        const x = xFrom + (xTo - xFrom) * delta / 1000;
        const y = yFrom + (yTo - yFrom) * delta / 1000;
        push();
        translate(x, y);
        image(ENEMY_IMG, 2, 2, cellWidth - 4, cellHeight - 4);
        pop();
    }
}
