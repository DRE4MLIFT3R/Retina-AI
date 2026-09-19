import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from PIL import Image
from torchvision import transforms
from pathlib import Path


# ============================================================
# 1. Custom Dataset
# ============================================================

class DiabeticRetinopathyDataset(Dataset):

    def __init__(self, csv_file, image_dir, transform=None):

        self.data = pd.read_csv(csv_file)
        self.image_dir = Path(image_dir)
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):

        # Get image ID
        image_id = self.data.iloc[index]["id_code"]

        # Get diagnosis label
        label = int(self.data.iloc[index]["diagnosis"])

        # Create image path
        image_path = self.image_dir / f"{image_id}.png"

        # Open image
        image = Image.open(image_path).convert("RGB")

        # Apply transformations
        if self.transform:
            image = self.transform(image)

        return image, label


# ============================================================
# 2. Training Transformations
# ============================================================

train_transform = transforms.Compose([

    # Resize image
    transforms.Resize((224, 224)),

    # Randomly flip image horizontally
    transforms.RandomHorizontalFlip(p=0.5),

    # Small random rotation
    transforms.RandomRotation(10),

    # Convert image to PyTorch Tensor
    transforms.ToTensor(),

    # Normalize image
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# 3. Validation Transformations
# ============================================================

val_transform = transforms.Compose([

    # Resize image
    transforms.Resize((224, 224)),

    # Convert image to Tensor
    transforms.ToTensor(),

    # Normalize image
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# 4. Create Training Dataset
# ============================================================

train_dataset = DiabeticRetinopathyDataset(
    csv_file="dataset/train_split.csv",
    image_dir="dataset/train_images",
    transform=train_transform
)


# ============================================================
# 5. Create Validation Dataset
# ============================================================

val_dataset = DiabeticRetinopathyDataset(
    csv_file="dataset/val_split.csv",
    image_dir="dataset/train_images",
    transform=val_transform
)


# ============================================================
# 6. Create Training DataLoader
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True
)


# ============================================================
# 7. Create Validation DataLoader
# ============================================================

val_loader = DataLoader(
    val_dataset,
    batch_size=32,
    shuffle=False
)


# ============================================================
# 8. Test Dataset + DataLoader
# ============================================================

test_dataset = DiabeticRetinopathyDataset(
    csv_file="dataset/test_split.csv",
    image_dir="dataset/train_images",
    transform=val_transform
)

test_loader = DataLoader(
    test_dataset,
    batch_size=32,
    shuffle=False
)


# ============================================================
# 9. Test Everything
# ============================================================

if __name__ == "__main__":

    print("======================================")
    print("Dataset Information")
    print("======================================")

    print(f"Training images   : {len(train_dataset)}")
    print(f"Validation images : {len(val_dataset)}")
    print(f"Test images       : {len(test_dataset)}")

    print("\nLoading one training batch...")

    images, labels = next(iter(train_loader))

    print("\nImage batch shape:")
    print(images.shape)

    print("\nLabel batch shape:")
    print(labels.shape)

    print("\nLabels:")
    print(labels)

    print("\n======================================")
    print("Dataset pipeline working successfully!")
    print("======================================")