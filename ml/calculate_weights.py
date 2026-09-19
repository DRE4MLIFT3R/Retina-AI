import pandas as pd
import torch
from pathlib import Path

# Load training split
dataset_path = Path("dataset")
train_df = pd.read_csv(dataset_path / "train_split.csv")

# Count each class
class_counts = train_df["diagnosis"].value_counts().sort_index()

print("Class counts:")
print(class_counts)

# Total training samples
total_samples = len(train_df)

# Number of classes
num_classes = len(class_counts)

# Calculate class weights
weights = total_samples / (num_classes * class_counts)

print("\nClass weights:")

for class_id, weight in weights.items():
    print(f"Class {class_id}: {weight:.4f}")

# Convert to PyTorch tensor
class_weights = torch.tensor(
    weights.values,
    dtype=torch.float32
)

print("\nPyTorch tensor:")
print(class_weights)