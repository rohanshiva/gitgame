import { Chunk } from "../interfaces/chunk";


class ChunkService {

    static getAsCode(chunk: Chunk): string {
        return chunk.lines.map((chunkLine) => {
            return chunkLine.content.trimEnd();
        }).join("\n");
    }
}

export default ChunkService;