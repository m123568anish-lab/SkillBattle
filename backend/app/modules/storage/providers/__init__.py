from .local import LocalStorage
from .s3 import S3Storage
from .cloudinary import CloudinaryStorage
from .minio import MinIOStorage

__all__ = [
    "LocalStorage",
    "S3Storage",
    "CloudinaryStorage",
    "MinIOStorage",
]