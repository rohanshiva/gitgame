export default interface IPlayer {
  username: string;
  has_guessed: boolean;
  score: number;
  guess?: string;
}
