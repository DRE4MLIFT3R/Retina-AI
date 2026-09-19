import torch
import torch.nn as nn
from torch.optim import Adam
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from tqdm import tqdm
from pathlib import Path

from dataset import train_loader, val_loader


# ======================================
# Configuration
# ======================================

NUM_CLASSES = 5
LEARNING_RATE = 0.0001
EPOCHS = 10

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

BEST_MODEL_PATH = MODEL_DIR / "best_efficientnet_b0.pth"


# ======================================
# Load Pretrained EfficientNet-B0
# ======================================

weights = EfficientNet_B0_Weights.DEFAULT

model = efficientnet_b0(
    weights=weights
)

in_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    in_features,
    NUM_CLASSES
)

model = model.to(DEVICE)


# ======================================
# Class Weights
# ======================================

class_weights = torch.tensor(
    [
        0.4059,
        1.9792,
        0.7333,
        3.7970,
        2.4763
    ],
    dtype=torch.float32
).to(DEVICE)


# ======================================
# Loss & Optimizer
# ======================================

criterion = nn.CrossEntropyLoss(
    weight=class_weights
)

optimizer = Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# ======================================
# Training Function
# ======================================

def train_one_epoch():

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    progress_bar = tqdm(
        train_loader,
        desc="Training"
    )

    for images, labels in progress_bar:

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(
            outputs,
            labels
        )

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        total += labels.size(0)

        correct += (
            predictions == labels
        ).sum().item()

        progress_bar.set_postfix(
            loss=f"{loss.item():.4f}"
        )

    epoch_loss = (
        running_loss / len(train_loader)
    )

    epoch_accuracy = (
        100 * correct / total
    )

    return epoch_loss, epoch_accuracy


# ======================================
# Validation Function
# ======================================

def validate():

    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            running_loss += loss.item()

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            total += labels.size(0)

            correct += (
                predictions == labels
            ).sum().item()

    val_loss = (
        running_loss / len(val_loader)
    )

    val_accuracy = (
        100 * correct / total
    )

    return val_loss, val_accuracy


# ======================================
# Training
# ======================================

print("======================================")
print("Starting Training")
print("======================================")

print("Device:", DEVICE)
print("Model: EfficientNet-B0")
print("Epochs:", EPOCHS)
print("Learning Rate:", LEARNING_RATE)

best_val_accuracy = 0.0


for epoch in range(EPOCHS):

    print(
        f"\nEpoch {epoch + 1}/{EPOCHS}"
    )

    train_loss, train_accuracy = train_one_epoch()

    val_loss, val_accuracy = validate()

    print(
        f"Train Loss: {train_loss:.4f}"
    )

    print(
        f"Train Accuracy: {train_accuracy:.2f}%"
    )

    print(
        f"Validation Loss: {val_loss:.4f}"
    )

    print(
        f"Validation Accuracy: {val_accuracy:.2f}%"
    )


    # ==================================
    # Save Best Model
    # ==================================

    if val_accuracy > best_val_accuracy:

        best_val_accuracy = val_accuracy

        torch.save(
            {
                "epoch": epoch + 1,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_accuracy": val_accuracy,
                "val_loss": val_loss
            },
            BEST_MODEL_PATH
        )

        print(
            f"⭐ Best model saved!"
        )

        print(
            f"Best Validation Accuracy: "
            f"{best_val_accuracy:.2f}%"
        )


print("\n======================================")
print("Training Complete!")
print("======================================")

print(
    f"Best Validation Accuracy: "
    f"{best_val_accuracy:.2f}%"
)

print(
    f"Best model saved at:"
)

print(
    BEST_MODEL_PATH
)