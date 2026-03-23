import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks
from app.models.schemas import UploadResponse
from app.services.pdf_utils import extract_text_from_pdf_bytes, fast_extract_metadata
from app.services.rag_utils import process_document_background
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Ensure upload directory exists
os.makedirs(settings.pdf_upload_dir, exist_ok=True)

@router.post("", response_model=UploadResponse)
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only application/pdf is allowed."
        )
        
    # Read file into memory
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to read file.")
        
    # Check payload size
    MAX_SIZE = 50 * 1024 * 1024
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Max 50MB.")
        
    # 1. Save original PDF to disk immediately
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.pdf_upload_dir, f"{file_id}.pdf")
    try:
        with open(save_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        logger.error(f"Critical Upload Error for {file.filename}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed for {file.filename}: {str(e)}"
        )

    page_count = 0
    title = file.filename or "Uploaded document"
    try:
        extracted_meta = fast_extract_metadata(file_bytes)
        if isinstance(extracted_meta, dict):
            title = extracted_meta.get("title") or title
            page_count = int(extracted_meta.get("pages") or 0)
    except Exception as e:
        logger.warning(f"Metadata extraction failed for {file.filename}: {e}")

    # 2. Offload FULL extraction and indexing to an independent task
    import asyncio
    asyncio.create_task(asyncio.to_thread(process_document_background, file_id, save_path, file.filename or title))
    logger.info(f"Background processing task scheduled for file {file_id}")
        
    return UploadResponse(
        status="ok",
        file_id=file_id,
        pages=page_count,
        title=title
    )
