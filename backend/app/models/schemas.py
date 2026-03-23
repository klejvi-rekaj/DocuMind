from pydantic import BaseModel
from typing import List, Optional

class UploadResponse(BaseModel):
    status: str
    file_id: str
    pages: Optional[int] = 0
    text_summary: Optional[str] = None
    title: Optional[str] = None

class Chunk(BaseModel):
    file_id: str
    page: int
    text_snippet: str
    
class SourceChunk(BaseModel):
    file_id: str
    page: int
    text_snippet: str
    score: float

class QueryRequest(BaseModel):
    file_ids: List[str]
    question: str
    top_k: int = 3
    notebook_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    source_chunks: List[SourceChunk]

class ChatMessage(BaseModel):
    role: str
    content: str

class ConversationStateResponse(BaseModel):
    notebook_id: str
    summary: str = ""
    messages: List[ChatMessage] = []
