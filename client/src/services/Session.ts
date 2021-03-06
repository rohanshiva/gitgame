import config from "../config/Config";
import { StatusCodes } from "http-status-codes";
import api from "../utils/Api";
import Session from "../interfaces/Session";
import { Chunk, ChunkLine } from "../interfaces/Chunk";

class SessionService {
  private static getExtension(filename: string) {
    const fileParts = filename.split(".");
    return filename.includes(".") ? fileParts[fileParts.length - 1] : "";
  }

  static processChunkFromJson(chunkData: any): Chunk {
    const {
      filename,
      lines,
    }: {
      filename: string;
      lines: ChunkLine[];
    } = chunkData;

    const extension = this.getExtension(filename);
    return {
      filename,
      extension,
      lines,
    };
  }

  static async makeSession(players: string[]): Promise<Session> {
    try {
      const response = await api.post(config.make.uri, players);
      if (response.status === StatusCodes.CREATED) {
        const id: string = response.data.id;
        return { players, id };
      } else {
        throw Error(`Failed to make session: ${response.statusText}`);
      }
    } catch (error: any) {
      throw Error(error.response.data.detail);
    }
  }

  static async getSession(sessionId: string): Promise<Session> {
    const url = config.getSession.uri.replace(":sessionId", sessionId);
    const response = await api.get(url);
    if (response.status === StatusCodes.OK) {
      return response.data;
    } else {
      throw Error(`Failed to get session ${sessionId}: ${response.statusText}`);
    }
  }

  static async pick(sessionId: string): Promise<Chunk> {
    const url = config.pick.uri.replace(":sessionId", sessionId);
    const response = await api.get(url);
    if (response.status === StatusCodes.OK) {
      return this.processChunkFromJson(response.data);
    } else {
      throw Error(
        `Failed to pick a chunk for session ${sessionId}: ${response.statusText}`
      );
    }
  }

  static async peek(sessionId: string, direction: string): Promise<Chunk> {
    const url = config.peek.uri.replace(":sessionId", sessionId);
    const response = await api.get(url, {
      params: {
        direction: direction,
      },
    });

    if (response.status === StatusCodes.OK) {
      return this.processChunkFromJson(response.data);
    } else {
      throw Error(
        `Failed to peek in file for session ${sessionId}: ${response.statusText}`
      );
    }
  }

  static async getChunk(sessionId: string): Promise<Chunk> {
    const url = config.chunk.uri.replace(":sessionId", sessionId);
    const response = await api.get(url);

    if (response.status === StatusCodes.OK) {
      return this.processChunkFromJson(response.data);
    } else {
      throw Error(
        `Failed to get chunk for session ${sessionId}: ${response.statusText}`
      );
    }
  }
}

export default SessionService;
