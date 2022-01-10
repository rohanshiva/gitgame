import { Chunk } from "./Chunk";

interface IPrompt {
  choices: string[];
  guessExpiration: Date;
  chunk: Chunk;
}

export default IPrompt;
