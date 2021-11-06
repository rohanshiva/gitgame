class Chunk:
    
    def __init__(self, start_line : int, end_line : int, content : str):
        self.__start_line = start_line
        self.__end_line = end_line
        self.__content = content
