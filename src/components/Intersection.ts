export class Intersection {
  private x: number;
  private y: number;
  private value: string;

  constructor(x: number, y: number, value: string = 'empty') {
    this.x = x;
    this.y = y;
    this.value = value;
  }

  getY(): number {
    return this.y;
  }

  getX(): number {
    return this.x;
  }

  duplicate(): Intersection {
    const intersection = new Intersection(this.x, this.y, this.value);
    return intersection;
  }

  isOccupiedWith(color: string): boolean {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  }

  isEmpty(): boolean {
    return this.value === 'empty';
  }

  setWhite(): void {
    this.value = 'white';
  }

  setBlack(): void {
    this.value = 'black';
  }

  setEmpty(): void {
    this.value = 'empty';
  }

  isBlack(): boolean {
    return this.value === 'black';
  }

  isWhite(): boolean {
    return this.value === 'white';
  }

  sameColorAs(i: Intersection): boolean {
    return i.value === this.value;
  }
}
