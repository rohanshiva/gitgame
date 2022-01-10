import { Chunk } from "./Chunk";

interface IPrompt {
  choices: string[];
  endTimestamp: string;
  chunk: Chunk;
}

export default IPrompt;
