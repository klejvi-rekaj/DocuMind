import sqlite3
import json
import os
import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "documind.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = _get_conn()
    cursor = conn.cursor()
    
    # Conversations table: pairs notebook/session with messages and a summary
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            messages TEXT,
            summary TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Documents table: stores pre-generated summaries for fallback
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT,
            summary TEXT,
            metadata TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("PRAGMA table_info(conversations)")
    conversation_columns = {row["name"] for row in cursor.fetchall()}
    if "updated_at" not in conversation_columns:
        cursor.execute("ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    cursor.execute("PRAGMA table_info(documents)")
    document_columns = {row["name"] for row in cursor.fetchall()}
    if "title" not in document_columns:
        cursor.execute("ALTER TABLE documents ADD COLUMN title TEXT")
    if "metadata" not in document_columns:
        cursor.execute("ALTER TABLE documents ADD COLUMN metadata TEXT")
    if "updated_at" not in document_columns:
        cursor.execute("ALTER TABLE documents ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")

def get_conversation(notebook_id: str) -> Dict:
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT messages, summary FROM conversations WHERE id = ?", (notebook_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "messages": json.loads(row[0]),
            "summary": row[1] or ""
        }
    return {"messages": [], "summary": ""}

def save_conversation(notebook_id: str, messages: List[Dict], summary: str):
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (id, messages, summary, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            messages = excluded.messages,
            summary = excluded.summary,
            updated_at = CURRENT_TIMESTAMP
    """, (notebook_id, json.dumps(messages), summary))
    conn.commit()
    conn.close()

def get_document_summary(file_id: str) -> Optional[str]:
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT summary FROM documents WHERE id = ?", (file_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def get_document_record(file_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, summary, metadata FROM documents WHERE id = ?", (file_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "title": row["title"] or "",
        "summary": row["summary"] or "",
        "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
    }

def get_document_records(file_ids: List[str]) -> List[Dict[str, Any]]:
    records = []
    for file_id in file_ids:
        record = get_document_record(file_id)
        if record:
            records.append(record)
    return records

def save_document_summary(file_id: str, summary: str, title: str = "", metadata: Optional[Dict[str, Any]] = None):
    conn = _get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (id, title, summary, metadata, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            summary = excluded.summary,
            metadata = excluded.metadata,
            updated_at = CURRENT_TIMESTAMP
    """, (file_id, title, summary, json.dumps(metadata or {})))
    conn.commit()
    conn.close()

# Initialize on import
init_db()
