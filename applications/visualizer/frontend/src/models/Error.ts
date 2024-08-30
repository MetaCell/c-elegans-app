export class GlobalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlobalError";
  }
}
