import IPlayer from "./Player"


export interface IRepository{
    name: string;
    starCount: number;
    url: string;
    language: string;
    description: string;
}

interface IAnswer {
    players: IPlayer[];
    correctChoice: string;
    repository: IRepository
}

export default IAnswer;