from fastapi import FastAPI
from routes import session
from github import Github
from typing import List
import json
from services.chunk_fetcher import ChunkFetcher, RandomChunkFetcher
from services.file import File, NetworkFile

from services.file_fetcher import GithubFileFetcher
from services.file_rule import CodeFileRule
from services.chunk import Chunk
from config import GITHUB_ACCESS_TOKEN



app = FastAPI()

app.include_router(session.router)


@app.get("/home")
def home():
    return 200, {"message": "ok"}


def serialize(files: List[File]):
    serial_files = list(map(lambda x: x.serialize(), files))
    with open("files.json", "w") as f:
        json.dump(serial_files, f, ensure_ascii=True, indent=2)

def deserialize():
    def create_network_file(serial_file):
        return NetworkFile(serial_file["user"], serial_file["path"], 
        serial_file["repo"], serial_file["download_url"], serial_file["size"])

    serial_files = []
    with open("files.json", "r") as f:
        serial_files = json.load(f)
    return list(map(create_network_file, serial_files))


def dump_chunk(chunk: Chunk, file_name: str):
    with open(file_name, "w") as f:
        start_position = chunk.get_start_line()
        lines = chunk.get_content().split("\n")
        for i in range(len(lines)):
            f.write(f"{i + start_position} {lines[i]}\n")

def main():
    
    g = Github(GITHUB_ACCESS_TOKEN)
    supported_extensions = ["py", "js", "ts", "jsx", "tsx", "go", "dart", "java", "cc", "cpp", "c"]
    file_fetcher = GithubFileFetcher(g, CodeFileRule(supported_extensions))
    files = file_fetcher.get_files(["TanushN"])

    print(len(files))

    chunk_fetcher = RandomChunkFetcher(20, 10, 8)
    chunk_fetcher.add_files(files)
    chunk_fetcher.pick_starting_chunk()
    dump_chunk(chunk_fetcher.get_chunk(), "./chunk-test/initial.txt")
    for i in range(4):
        chunk_fetcher.peek_above()
    dump_chunk(chunk_fetcher.get_chunk(), "./chunk-test/peek-above.txt")

    for i in range(4):
        chunk_fetcher.peek_below()
        dump_chunk(chunk_fetcher.get_chunk(), "./chunk-test/peek-below.txt")



main()