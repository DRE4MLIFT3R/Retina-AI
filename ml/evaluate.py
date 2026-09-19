import torch
import torch.nn as nn

from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

import numpy as np

from dataset import test_loader


# ======================================
# Configuration
# ======================================

NUM_CLASSES = 5

MODEL_PATH = "models/best_efficientnet_b0.pth"

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


CLASS_NAMES = [
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative DR"
]


# ======================================
# Load Model
# ======================================

print("======================================")
print("Loading Best Model")
print("======================================")

weights = EfficientNet_B0_Weights.DEFAULT

model = efficientnet_b0(
    weights=None
)

in_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    in_features,
    NUM_CLASSES
)


checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(DEVICE)

model.eval()


print("Model:", "EfficientNet-B0")
print("Device:", DEVICE)
print(
    f"Best Validation Accuracy: "
    f"{checkpoint['val_accuracy']:.2f}%"
)


# ======================================
# Test Evaluation
# ======================================

print("\n======================================")
print("Evaluating Test Dataset")
print("======================================")

all_labels = []
all_predictions = []


with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(DEVICE)

        outputs = model(images)

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        all_labels.extend(
            labels.numpy()
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )


# Convert to numpy arrays

all_labels = np.array(all_labels)
all_predictions = np.array(all_predictions)


# ======================================
# Accuracy
# ======================================

test_accuracy = accuracy_score(
    all_labels,
    all_predictions
)


print(
    f"\nTest Accuracy: "
    f"{test_accuracy * 100:.2f}%"
)


# ======================================
# Classification Report
# ======================================

print("\n======================================")
print("Classification Report")
print("======================================")

report = classification_report(
    all_labels,
    all_predictions,
    target_names=CLASS_NAMES,
    digits=4,
    zero_division=0
)

print(report)


# ======================================
# Confusion Matrix
# ======================================

cm = confusion_matrix(
    all_labels,
    all_predictions
)


print("\n======================================")
print("Confusion Matrix")
print("======================================")

print(cm)


print("\n======================================")
print("Evaluation Complete!")
print("======================================")