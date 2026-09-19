import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

# Paths
dataset_path = Path("dataset")
csv_path = dataset_path / "train.csv"

# Load CSV
df = pd.read_csv(csv_path)

print("Total images:", len(df))

# First split: 70% train, 30% temporary
train_df, temp_df = train_test_split(
    df,
    test_size=0.30,
    stratify=df["diagnosis"],
    random_state=42
)

# Second split: temporary into 15% validation + 15% test
val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    stratify=temp_df["diagnosis"],
    random_state=42
)

print("\nTrain:", len(train_df))
print("Validation:", len(val_df))
print("Test:", len(test_df))

print("\nTrain distribution:")
print(train_df["diagnosis"].value_counts().sort_index())

print("\nValidation distribution:")
print(val_df["diagnosis"].value_counts().sort_index())

print("\nTest distribution:")
print(test_df["diagnosis"].value_counts().sort_index())

# Save split CSV files
train_df.to_csv(dataset_path / "train_split.csv", index=False)
val_df.to_csv(dataset_path / "val_split.csv", index=False)
test_df.to_csv(dataset_path / "test_split.csv", index=False)

print("\n✅ Split files created successfully!")