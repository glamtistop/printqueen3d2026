import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Cloudinary - automatically reads CLOUDINARY_URL environment variable
cloudinary_url = os.getenv('CLOUDINARY_URL')
if cloudinary_url:
    # Parse the URL manually and configure
    import re
    match = re.match(r'cloudinary://([^:]+):([^@]+)@(.+)', cloudinary_url)
    if match:
        api_key, api_secret, cloud_name = match.groups()
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
    else:
        raise ValueError(f"Invalid CLOUDINARY_URL format: {cloudinary_url}")

class CloudinaryService:
    @staticmethod
    def _require_configured():
        if not cloudinary_url:
            raise Exception("Cloudinary is not configured. Add CLOUDINARY_URL to the backend environment.")

    @staticmethod
    def upload_image(file_content: bytes, folder: str = "products", public_id: str = None) -> dict:
        """Upload image to Cloudinary with optimization"""
        try:
            CloudinaryService._require_configured()
            upload_options = {
                "folder": folder,
                "resource_type": "image",
                "transformation": [
                    {"width": 1200, "height": 1200, "crop": "limit", "quality": "auto"},
                ],
                "eager": [
                    {"width": 300, "height": 300, "crop": "fill", "quality": "auto"},  # Thumbnail
                    {"width": 600, "height": 600, "crop": "fill", "quality": "auto"},  # Medium
                ],
                "eager_async": False,
            }
            
            if public_id:
                upload_options["public_id"] = public_id
            
            result = cloudinary.uploader.upload(file_content, **upload_options)
            
            return {
                "public_id": result["public_id"],
                "url": result["url"],
                "secure_url": result["secure_url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "thumbnail_url": result.get("eager", [])[0]["secure_url"] if result.get("eager") else result["secure_url"]
            }
        except Exception as e:
            raise Exception(f"Cloudinary upload failed: {str(e)}")
    
    @staticmethod
    def delete_image(public_id: str) -> dict:
        """Delete image from Cloudinary"""
        try:
            CloudinaryService._require_configured()
            result = cloudinary.uploader.destroy(public_id)
            return {"result": result.get("result"), "public_id": public_id}
        except Exception as e:
            raise Exception(f"Cloudinary delete failed: {str(e)}")
    
    @staticmethod
    def delete_multiple_images(public_ids: list) -> dict:
        """Delete multiple images from Cloudinary"""
        try:
            CloudinaryService._require_configured()
            result = cloudinary.api.delete_resources(public_ids)
            return result
        except Exception as e:
            raise Exception(f"Cloudinary bulk delete failed: {str(e)}")
