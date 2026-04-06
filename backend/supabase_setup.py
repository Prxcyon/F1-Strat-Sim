import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

BUCKET_NAME = "f1-assets"

def setup_storage():
    try:
        # Create bucket if it doesn't exist
        res = supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
        print(f"Bucket {BUCKET_NAME} created.")
    except Exception as e:
        print(f"Bucket might already exist or error: {e}")

    # Upload the car model
    file_path = "../frontend/public/f1-car-compressed.glb"
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path="f1-car.glb",  # We'll still keep the name 'f1-car.glb' in Storage
                file=f,
                file_options={"content-type": "model/gltf-binary", "x-upsert": "true"}
            )
            print("f1-car.glb uploaded successfully.")
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url("f1-car.glb")
            print(f"PUBLIC URL: {public_url}")
    else:
        print(f"File not found at {file_path}")

if __name__ == "__main__":
    setup_storage()
