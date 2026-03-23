import logging
import json
from typing import Dict, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app import db
from app.models.schemas import ConversationStateResponse, QueryRequest, SourceChunk
from app.services.ai_utils import (
    build_acknowledgement_response,
    classify_intent,
    rewrite_query,
    stream_rag_response,
    update_conversation_summary,
)
from app.services.rag_utils import (
    build_document_summary_fallback,
    get_document_titles,
    hybrid_search,
    is_low_confidence,
    rerank_chunks,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/query", tags=["query"])


def _build_conversation_id(request: QueryRequest) -> str:
    if request.notebook_id:
        return request.notebook_id
    if request.file_ids:
        return f"files:{'-'.join(sorted(request.file_ids))}"
    return "global"


def _last_assistant_message(messages: List[Dict[str, str]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "assistant" and message.get("content"):
            return message["content"]
    return ""


@router.get("/history/{notebook_id}", response_model=ConversationStateResponse)
async def get_conversation_history(notebook_id: str):
    conversation = db.get_conversation(notebook_id)
    return ConversationStateResponse(
        notebook_id=notebook_id,
        summary=conversation.get("summary", ""),
        messages=conversation.get("messages", []),
    )


@router.post("")
async def query_documents(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    top_k = max(request.top_k, 10)
    conversation_id = _build_conversation_id(request)
    conversation = db.get_conversation(conversation_id)
    conversation_messages: List[Dict[str, str]] = conversation.get("messages", [])
    conversation_summary = conversation.get("summary", "")

    intent = classify_intent(request.question, conversation_summary)
    pending_messages = conversation_messages + [{"role": "user", "content": request.question}]

    if intent == "acknowledgement":
        response_text = build_acknowledgement_response(request.question)
        db.save_conversation(
            conversation_id,
            pending_messages + [{"role": "assistant", "content": response_text}],
            conversation_summary,
        )

        async def acknowledgement_stream():
            yield 'data: {"type": "sources", "chunks": []}\n\n'
            yield f"data: {json.dumps({'type': 'message', 'content': response_text})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(acknowledgement_stream(), media_type="text/event-stream")

    doc_titles = get_document_titles(request.file_ids)
    rewritten_query = rewrite_query(request.question, conversation_summary, doc_titles, intent=intent)

    try:
        primary_results = hybrid_search(rewritten_query, file_ids=request.file_ids or None, top_k=top_k)
        alternate_results = []
        if rewritten_query.strip() != request.question.strip():
            alternate_results = hybrid_search(request.question, file_ids=request.file_ids or None, top_k=max(6, top_k // 2))

        combined_map = {}
        for chunk in primary_results + alternate_results:
            key = (chunk.file_id, chunk.page, chunk.text_snippet)
            previous = combined_map.get(key)
            if previous is None or chunk.score > previous.score:
                combined_map[key] = chunk

        reranked_results = rerank_chunks(rewritten_query, list(combined_map.values()), top_k=top_k)
    except Exception as exc:
        logger.error(f"Search error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Search failed.")

    fallback_summary = build_document_summary_fallback(request.file_ids)

    if intent == "follow_up_question":
        previous_answer = _last_assistant_message(conversation_messages)
        if previous_answer:
            reranked_results = [
                SourceChunk(
                    file_id=request.file_ids[0] if request.file_ids else "conversation",
                    page=0,
                    text_snippet=previous_answer,
                    score=1.0,
                )
            ] + reranked_results[:9]

    if is_low_confidence(reranked_results) and fallback_summary:
        reranked_results = []

    if not reranked_results and not fallback_summary:
        fallback_summary = "I could not match a precise passage yet, but the uploaded documents are still available. Try asking for the main topic, a section, or a definition from the document."

    def _persist_assistant_reply(final_answer: str):
        updated_messages = pending_messages + [{"role": "assistant", "content": final_answer}]
        next_summary = conversation_summary
        should_refresh_summary = len(updated_messages) <= 4 or len(updated_messages) % 4 == 0 or intent == "follow_up_question"
        if should_refresh_summary:
            try:
                next_summary = update_conversation_summary(conversation_summary, updated_messages, final_answer)
            except Exception as exc:
                logger.warning(f"Summary update failed for {conversation_id}: {exc}")
        db.save_conversation(conversation_id, updated_messages, next_summary)

    try:
        return StreamingResponse(
            stream_rag_response(
                request.question,
                reranked_results[:10],
                conversation_summary=conversation_summary,
                intent=intent,
                fallback_summary=fallback_summary,
                on_complete=_persist_assistant_reply,
            ),
            media_type="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",
                "X-Conversation-Id": conversation_id,
                "X-Intent": intent,
                "X-Rewritten-Query": rewritten_query,
            },
        )
    except Exception as exc:
        logger.error(f"Inference error: {exc}", exc_info=True)

        async def error_stream():
            yield f'data: {{"type": "error", "content": "Communication with AI failed. {str(exc)}"}}\n\n'
            yield "data: [DONE]\n\n"

        return StreamingResponse(error_stream(), media_type="text/event-stream")
