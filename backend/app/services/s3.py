import os
import uuid
import boto3
from botocore.exceptions import ClientError
from app.config import settings

def get_s3_client():
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    return None

def upload_contract_file(file_bytes: bytes, filename: str) -> str:
    """
    Uploads file to AWS S3. If S3 details are missing, saves it locally.
    Returns the key or file path string.
    """
    unique_filename = f"{uuid.uuid4()}_{filename}"
    s3_client = get_s3_client()
    
    if s3_client and settings.AWS_S3_BUCKET:
        try:
            s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=unique_filename,
                Body=file_bytes
            )
            print(f"Successfully uploaded {filename} to AWS S3 bucket {settings.AWS_S3_BUCKET}")
            return f"s3://{settings.AWS_S3_BUCKET}/{unique_filename}"
        except ClientError as e:
            print(f"AWS S3 upload failed, falling back to local storage: {str(e)}")
            # Fall through to local storage
            
    # Local Storage Fallback
    local_path = os.path.join(settings.LOCAL_STORAGE_DIR, unique_filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)
    print(f"Saved {filename} locally to {local_path}")
    return local_path

def get_contract_file_bytes(s3_key: str) -> bytes:
    """
    Downloads file from S3 or local directory.
    """
    if s3_key.startswith("s3://"):
        # Parse S3 URI
        parts = s3_key[5:].split("/", 1)
        bucket = parts[0]
        key = parts[1]
        
        s3_client = get_s3_client()
        if s3_client:
            try:
                response = s3_client.get_object(Bucket=bucket, Key=key)
                return response['Body'].read()
            except Exception as e:
                raise ValueError(f"Failed to read from S3: {str(e)}")
    
    # Fallback to local reading
    if os.path.exists(s3_key):
        with open(s3_key, "rb") as f:
            return f.read()
    else:
        # Check if file is just in local storage directory
        local_path = os.path.join(settings.LOCAL_STORAGE_DIR, os.path.basename(s3_key))
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
                
    raise FileNotFoundError(f"Contract file not found: {s3_key}")
