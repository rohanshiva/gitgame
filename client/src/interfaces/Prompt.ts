import { Chunk } from "./chunk";
interface IPrompt {
  choices: string[];
  endTimestamp: string;
  chunk?: Chunk;
}

export default IPrompt;
