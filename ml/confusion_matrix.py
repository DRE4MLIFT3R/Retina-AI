import torch
import torch.nn as nn

from torchvision.models import efficientnet_b0

from sklearn.metrics import confusion_matrix

import matplotlib.pyplot as plt

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

print("Model: EfficientNet-B0")
print("Device:", DEVICE)
print(
    f"Best Validation Accuracy: "
    f"{checkpoint['val_accuracy']:.2f}%"
)


# ======================================
# Get Predictions
# ======================================

print("\n======================================")
print("Generating Predictions")
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


# ======================================
# Confusion Matrix
# ======================================

cm = confusion_matrix(
    all_labels,
    all_predictions
)


print("\nConfusion Matrix:")
print(cm)


# ======================================
# Plot
# ======================================

plt.figure(
    figsize=(9, 7)
)

plt.imshow(cm)

plt.title(
    "Diabetic Retinopathy Confusion Matrix"
)

plt.xlabel(
    "Predicted Class"
)

plt.ylabel(
    "Actual Class"
)

plt.xticks(
    range(NUM_CLASSES),
    CLASS_NAMES,
    rotation=30,
    ha="right"
)

plt.yticks(
    range(NUM_CLASSES),
    CLASS_NAMES
)


# Add numbers inside cells

for i in range(NUM_CLASSES):

    for j in range(NUM_CLASSES):

        plt.text(
            j,
            i,
            cm[i, j],
            ha="center",
            va="center"
        )


plt.colorbar()

plt.tight_layout()


# ======================================
# Save Figure
# ======================================

output_path = "models/confusion_matrix.png"

plt.savefig(
    output_path,
    dpi=300,
    bbox_inches="tight"
)

print(
    f"\nConfusion matrix saved to:"
)

print(output_path)

plt.show()


print("\n======================================")
print("Confusion Matrix Complete!")
print("======================================")