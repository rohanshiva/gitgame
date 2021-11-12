
export interface ChunkLine {
    line_number: number
    content: string
}

export interface Chunk {
    filename: string
    extension: string
    lines: ChunkLine[]
}