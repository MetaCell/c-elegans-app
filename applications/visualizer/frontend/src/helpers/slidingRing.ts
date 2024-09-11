export interface SlidingRingCb<T> {
  onPush: (n: number) => T; // called any time a new object is pushed into the ring
  onSelected: (n: number, o: T) => void; // called when the selected object changes
  onUnselected: (n: number, o: T) => void; // called when an object is unselected
  onEvict: (n: number, o: T) => void; // called when an object is evicted from the ring
}

export interface SlidingRingOptions<T> extends SlidingRingCb<T> {
  cacheSize: number;
  startAt: number;
  extent: [number, number];
}

/**
 * A Sliding Ring is a fixed size ring buffer that maintains in memory
 * a window in to an extent of sequenced values.
 *
 * With a cacheSize of 5, it will maintain in memory 2 elements before
 * and after startAt element, e.g with an extent of [0, 714] and a startAt
 * of 300, it will maintain in memory [298, 299, 300, 301, 302].
 *                                      ^         ^         ^
 *                                     tail    selected    head
 *
 * Advancing in to the next element (301), 298 will be evicted and 303 will
 * be put in its place, keeping in memory [303, 299, 300, 301, 302]
 *                                          ^    ^         ^
 *                                        head  tail   selected
 *
 * Going back on the previous element follows the same logic.
 */
export class SlidingRing<T> {
  private extent: [number, number];

  private ring: Array<{
    n: number; // position within extent
    o: T;
  }>;

  private pos: number; // current buffer position
  private tail: number; // buffer tail
  private head: number; // buffer head

  private cb: SlidingRingCb<T>;

  constructor(options: SlidingRingOptions<T>) {
    if (options.cacheSize < 3) {
      throw Error("cache should be greater that 3");
    }

    const [min, max] = options.extent;

    if (min >= max) {
      throw Error("extent should be [min,max], where min < max");
    }

    if (options.startAt > max || options.startAt < min) {
      throw Error("startAt must be within extent");
    }

    const extentSize = max - min;
    if (extentSize < 3) {
      throw Error("extent size is too small, should be greater than 3");
    }

    if (extentSize < options.cacheSize) {
      options.cacheSize = max - min;
    }

    this.ring = new Array(options.cacheSize);
    this.extent = options.extent;

    this.cb = {
      onPush: options.onPush,
      onSelected: options.onSelected,
      onUnselected: options.onUnselected,
      onEvict: options.onEvict,
    };

    this.initRing(options.startAt)
  }

  private initRing(at: number) {
    // initialize ring
    const halfSize = Math.floor(this.ring.length / 2);
    let tailN = at - halfSize;
    let headN = at + halfSize;

    // the ring may start near the extent
    // this account for that adjustment
    const [min, max] = this.extent;
    if (tailN < min) tailN = min;
    if (headN > max) {
      headN = max;
      tailN = headN - this.ring.length - 1;
    }

    // populate the ring
    for (let i = 0; i < this.ring.length; i++) {
      const n = tailN + i;
      const o = this.cb.onPush(n);

      this.ring[i] = { n, o };
    }

    this.pos = at - tailN;
    this.tail = 0;
    this.head = this.ring.length - 1;

    this.cb.onSelected(at, this.ring[this.pos].o);
  }

  next() {
    const [_, max] = this.extent;
    const nextN = this.ring[this.pos].n + 1;
    if (nextN > max) return;

    // update selected
    const nextPos = (this.pos + this.ring.length + 1) % this.ring.length;
    this.cb.onSelected(this.ring[nextPos].n, this.ring[nextPos].o);
    this.cb.onUnselected(this.ring[this.pos].n, this.ring[this.pos].o);

    // update sliding window
    const nextHeadN = this.ring[this.head].n + 1;
    const halfSize = Math.floor(this.ring.length / 2); // TODO: to avoid calc should we save as class property?
    const canSlideFurther = nextN - this.ring[this.tail].n > halfSize;

    if (nextHeadN <= max && canSlideFurther) {
      const tail = this.ring[this.tail];
      this.cb.onEvict(tail.n, tail.o);

      this.ring[this.tail] = {
        n: nextHeadN,
        o: this.cb.onPush(nextHeadN),
      };

      this.head = this.tail;
      this.tail = (this.tail + this.ring.length + 1) % this.ring.length;
    }

    this.pos = nextPos;
  }

  prev() {
    const [min, _] = this.extent;
    const prevN = this.ring[this.pos].n - 1;
    if (prevN < min) return;

    // update selected
    const prevPos = (this.pos + this.ring.length - 1) % this.ring.length;
    this.cb.onSelected(this.ring[prevPos].n, this.ring[prevPos].o);
    this.cb.onUnselected(this.ring[this.pos].n, this.ring[this.pos].o);

    // update sliding window
    const nextTailN = this.ring[this.tail].n - 1;
    const halfSize = Math.floor(this.ring.length / 2); // TODO: to avoid calc should we save as class property?
    const canSlideBackwards = this.ring[this.head].n - prevN > halfSize;

    if (nextTailN >= min && canSlideBackwards) {
      const head = this.ring[this.head];
      this.cb.onEvict(head.n, head.o);

      this.ring[this.head] = {
        n: nextTailN,
        o: this.cb.onPush(nextTailN),
      };

      this.tail = this.head;
      this.head = (this.tail + this.ring.length - 1) % this.ring.length;
    }

    this.pos = prevPos;
  }

  goto(n: number) {
    this.cb.onUnselected(this.ring[this.pos].n, this.ring[this.pos].o);
    for (const item of this.ring) {
      this.cb.onEvict(item.n, item.o);
    }
    this.initRing(n)
  }

  debug() {
    let text = "[";

    for (let i = 0; i < this.ring.length; i++) {
      if (this.ring[i] === undefined) {
        // should not happen
        text = text.concat("?");
        continue;
      }

      switch (true) {
        case i === this.pos:
          text = text.concat("*");
          break;
        case i === this.tail:
          text = text.concat("-");
          break;
        case i === this.head:
          text = text.concat("+");
          break;
      }

      text = text.concat(`${this.ring[i].n}`);
      if (i !== this.ring.length - 1) text = text.concat(", ");
    }
    text = text.concat("]");

    console.debug(text);
  }
}
