import os
import boto3
from botocore.client import Config
from typing import Optional

# R2 Configuration from environment
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL") # e.g., https://<account_id>.r2.cloudflarestorage.com
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "convoforge-recordings")

def get_r2_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto' # R2 doesn't use regions, but boto3 requires one
    )

def generate_presigned_upload_url(object_name: str, expiration: int = 3600) -> Optional[str]:
    """Generate a presigned URL to upload a file to R2."""
    s3_client = get_r2_client()
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': object_name},
            ExpiresIn=expiration
        )
    except Exception as e:
        print(f"Error generating presigned upload URL: {e}")
        return None
    return response

def generate_presigned_download_url(object_name: str, expiration: int = 3600) -> Optional[str]:
    """Generate a presigned URL to download a file from R2."""
    s3_client = get_r2_client()
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': object_name},
            ExpiresIn=expiration
        )
    except Exception as e:
        print(f"Error generating presigned download URL: {e}")
        return None
    return response
