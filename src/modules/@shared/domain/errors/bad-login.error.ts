export class BadLoginError extends Error {
  public status: number;

  constructor(message: string = 'Email ou senha incorretos') {
    super(message);
    this.name = 'BadLoginError';
    this.status = 400;
  }
}
