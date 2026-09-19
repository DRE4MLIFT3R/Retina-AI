import pandas as pd
from pathlib import Path

dataset_path = Path("dataset")
csv_path = dataset_path / "train.csv"
images_path = dataset_path / "train_images"

# Load CSV
df = pd.read_csv(csv_path)

# CSV image IDs
csv_ids = set(df["id_code"].astype(str))

# Actual image filenames
image_ids = {
    image.stem
    for image in images_path.glob("*.png")
}

print("CSV records:", len(csv_ids))
print("Image files:", len(image_ids))

# Images missing from folder
missing_images = csv_ids - image_ids

# Images without CSV entry
extra_images = image_ids - csv_ids

print("\nMissing images:", len(missing_images))
print("Extra images:", len(extra_images))

if len(missing_images) == 0 and len(extra_images) == 0:
    print("\n✅ CSV and images match perfectly!")
else:
    print("\n⚠️ There is a mismatch.")