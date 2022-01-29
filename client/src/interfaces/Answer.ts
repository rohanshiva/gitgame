import IPlayer from "./Player"


export interface Repository{
    name: string;
    starCount: number;
    url: string;
    language: string;
    description: string;
}

interface Answer {
    players: IPlayer[];
    correctChoice: string;
    repository: Repository
    chunkUrl: string;
}

export default Answer;