import { Chunk } from "../interfaces/Chunk";


class ChunkService {

    static getAsCode(chunk: Chunk): string {
        return chunk.lines.map((chunkLine) => {
            return chunkLine.content.trimEnd();
        }).join("\n");
    }

    static getStartLine(chunk: Chunk): number {
        return chunk.lines[0].line_number;
    }
}

export default ChunkService;