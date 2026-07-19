from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.models import TokenUsage
from app.config import settings
from fastapi import HTTPException, Depends
from app.database import get_db

def get_today_date():
    return datetime.utcnow().date()

def get_daily_token_usage(db: Session) -> int:
    today = get_today_date()
    usage = db.query(TokenUsage).filter(TokenUsage.date == today).first()
    return usage.tokens_used if usage else 0

def increment_token_usage(db: Session, token_count: int):
    today = get_today_date()
    usage = db.query(TokenUsage).filter(TokenUsage.date == today).first()
    if usage:
        usage.tokens_used += token_count
    else:
        usage = TokenUsage(date=today, tokens_used=token_count)
        db.add(usage)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to save token usage: {str(e)}")

def is_quota_exceeded(db: Session) -> bool:
    limit = settings.GEMINI_DAILY_TOKEN_LIMIT
    # Threshold is 98% of the daily limit to flag "near limit" or reached limit
    threshold = limit * 0.98
    used = get_daily_token_usage(db)
    return used >= threshold

def get_next_available_time() -> str:
    now_utc = datetime.now(timezone.utc)
    next_midnight = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    time_diff = next_midnight - now_utc
    hours, remainder = divmod(time_diff.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{hours}h {minutes}m (at 00:00 UTC)"

def get_quota_details(db: Session) -> dict:
    limit = settings.GEMINI_DAILY_TOKEN_LIMIT
    used = get_daily_token_usage(db)
    is_blocked = used >= (limit * 0.98)
    return {
        "limit": limit,
        "used": used,
        "is_blocked": is_blocked,
        "next_available": get_next_available_time()
    }

def verify_quota(db: Session = Depends(get_db)):
    if is_quota_exceeded(db):
        next_time = get_next_available_time()
        raise HTTPException(
            status_code=429,
            detail=f"Daily API token limit reached. Next available working time: {next_time}"
        )
