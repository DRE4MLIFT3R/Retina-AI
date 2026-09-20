# 🩺 RetinaAI — Explainable AI-Based Diabetic Retinopathy Screening System

RetinaAI is a full-stack AI-powered web application designed to analyze retinal fundus images and classify diabetic retinopathy into **five severity levels** using a deep learning model.

The system combines **EfficientNet-B0**, **Grad-CAM explainability**, **FastAPI**, **React**, and **MySQL** to provide an end-to-end AI screening workflow with authentication, prediction history, and an administrative dashboard.

> ⚠️ **Disclaimer:** RetinaAI is an academic/research prototype and is **not a medical diagnostic system**. Its predictions should not be used as a substitute for evaluation by a qualified medical professional.

---

## ✨ Features

### 🤖 AI-Based Retinal Image Classification

* Upload retinal fundus images through the web interface
* Classifies images into 5 diabetic retinopathy categories
* Provides prediction confidence
* Uses transfer learning with EfficientNet-B0
* Supports GPU acceleration when available

### 🔍 Explainable AI with Grad-CAM

RetinaAI generates a **Grad-CAM heatmap** to visualize image regions that contributed to the model's prediction.

This makes the model output more interpretable instead of presenting only a classification result.

### 👤 User Authentication

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Protected prediction and history endpoints
* Role-based access control

### 📊 Prediction History

Authenticated users can view their previous predictions including:

* Uploaded filename
* Predicted DR stage
* Confidence score
* Prediction timestamp
* Grad-CAM visualization

### 🛡️ Admin Dashboard

Administrators can monitor the overall system through a dedicated dashboard.

Includes:

* Total registered users
* Total predictions
* DR detection statistics
* Average prediction confidence
* DR class distribution
* Recent users
* Recent predictions
* User management view
* Prediction management view

### 📈 Data Visualization

Interactive charts are used to display prediction and system statistics.

---

## 🧠 Diabetic Retinopathy Classes

The model performs **5-class classification**:

| Class | Severity                           |
| ----- | ---------------------------------- |
| 0     | No Diabetic Retinopathy            |
| 1     | Mild                               |
| 2     | Moderate                           |
| 3     | Severe                             |
| 4     | Proliferative Diabetic Retinopathy |

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │       Backend        │
                    └───────┬───────┬──────┘
                            │       │
                    ┌───────┘       └─────────────┐
                    ▼                             ▼
          ┌──────────────────┐          ┌─────────────────┐
          │  EfficientNet-B0 │          │     MySQL       │
          │   PyTorch Model   │          │    Database     │
          └────────┬─────────┘          └─────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │    Grad-CAM      │
          │ Explainability   │
          └──────────────────┘
```

---

## 🔬 Machine Learning Pipeline

```text
Retinal Fundus Image
        │
        ▼
Image Preprocessing
        │
        ▼
EfficientNet-B0
        │
        ▼
5-Class Classification
        │
        ├──────────────► Prediction
        │
        └──────────────► Grad-CAM
                              │
                              ▼
                     Explainability Heatmap
```

---

## 🧪 Model Details

### Model

**EfficientNet-B0** with transfer learning using PyTorch.

The pretrained network was adapted for the 5-class diabetic retinopathy classification task.

### Training Configuration

| Parameter          | Value                          |
| ------------------ | ------------------------------ |
| Architecture       | EfficientNet-B0                |
| Framework          | PyTorch                        |
| Number of Classes  | 5                              |
| Optimizer          | Adam                           |
| Learning Rate      | 0.0001                         |
| Loss Function      | Weighted Cross Entropy         |
| Epochs             | 10                             |
| Dataset            | APTOS 2019 Blindness Detection |
| Train Samples      | 2,563                          |
| Validation Samples | 549                            |
| Test Samples       | 550                            |

Class-weighted loss was used to reduce the impact of class imbalance in the dataset.

---

## 📊 Model Performance

The trained model achieved:

**Test Accuracy: 81.27%**

### Classification Report

| Class                | Precision | Recall |   F1-Score |
| -------------------- | --------: | -----: | ---------: |
| No DR                |    0.9601 | 0.9779 |     0.9689 |
| Mild                 |    0.5556 | 0.7143 |     0.6250 |
| Moderate             |    0.8385 | 0.7267 |     0.7786 |
| Severe               |    0.4737 | 0.3103 |     0.3750 |
| Proliferative DR     |    0.4528 | 0.5455 |     0.4948 |
| **Overall Accuracy** |           |        | **81.27%** |

> The results show that performance varies across severity classes, particularly for the less frequent severe categories. This is an important limitation of the current prototype.

---

## 🔥 Grad-CAM Explainability

Grad-CAM is used to visualize areas of the retinal image that influenced the model's prediction.

Example workflow:

```text
Original Fundus Image
          +
     Model Prediction
          ↓
       Grad-CAM
          ↓
 Attention Heatmap
```

The heatmap should be interpreted as a visualization of **model sensitivity**, not as clinically validated lesion localization.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Chart.js
* react-chartjs-2
* CSS

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* PyJWT
* Passlib
* bcrypt

### Machine Learning

* PyTorch
* TorchVision
* EfficientNet-B0
* Grad-CAM
* NumPy
* Pillow
* Scikit-learn

### Database

* MySQL
* XAMPP

---

## 📁 Project Structure

```text
diabetic-retinopathy-ai/
│
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   └── models.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── ml/
│   ├── training scripts
│   ├── evaluation scripts
│   └── Grad-CAM utilities
│
├── models/
│   ├── best_efficientnet_b0.pth
│   ├── confusion_matrix.png
│   └── gradcam_result.png
│
├── dataset/
│   └── APTOS dataset files
│
├── .gitignore
└── README.md
```

---

## 🚀 Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/DRE4MLIFT3R/diabetic-retinopathy-ai.git
cd diabetic-retinopathy-ai
```

---

## 🐍 Backend Setup

Create and activate a virtual environment:

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

Start the FastAPI server:

```powershell
cd backend
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## ⚛️ Frontend Setup

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🗄️ Database Setup

The project uses MySQL.

Create a database named:

```sql
CREATE DATABASE retina_ai;
```

Make sure MySQL is running through XAMPP.

Configure the database connection in:

```text
backend/database.py
```

---

## 🔐 Authentication

RetinaAI uses JWT-based authentication.

Authentication flow:

```text
User
 │
 ▼
Login
 │
 ▼
FastAPI
 │
 ├── Verify bcrypt password
 │
 └── Generate JWT
          │
          ▼
       Frontend
          │
          ▼
 Protected API Requests
```

The backend also checks the user's role before allowing access to administrator endpoints.

---

## 🛡️ Security Notes

This project implements several basic security practices:

* Password hashing with bcrypt
* JWT authentication
* Protected API routes
* Role-based authorization
* SQLAlchemy ORM
* Input validation through FastAPI

For a production deployment, additional hardening would be required, including secure secret management, HTTPS, secure cookie-based authentication where appropriate, rate limiting, and stronger deployment configuration.

---

## 📚 Dataset

This project uses the **APTOS 2019 Blindness Detection** dataset.

The dataset contains retinal fundus images labeled according to diabetic retinopathy severity.

Dataset source:

[Kaggle — APTOS 2019 Blindness Detection](https://www.kaggle.com/competitions/aptos2019-blindness-detection)

The dataset is **not included in this repository**.

---

## ⚠️ Limitations

The current system is an academic prototype and has several limitations:

* Dataset size is relatively limited for a medical imaging problem.
* Class imbalance affects performance on less frequent severity levels.
* Severe-class recall is currently lower than the performance of the No DR class.
* Model predictions are not clinically validated.
* Grad-CAM provides model attention visualization rather than medically verified lesion localization.
* Performance may vary on images from different cameras, populations, or clinical environments.

---

## 🔮 Future Improvements

Potential future improvements include:

* Larger and more diverse retinal datasets
* Advanced data augmentation
* Hyperparameter optimization
* Model ensemble techniques
* Improved performance on minority classes
* More advanced explainability methods
* Model version management
* Cloud deployment
* Automated model monitoring
* Clinically validated evaluation

---

## 🎓 Academic Project

RetinaAI was developed as a **BTech Computer Science and Engineering project** combining:

* Machine Learning
* Deep Learning
* Computer Vision
* Explainable AI
* Full-Stack Development
* REST APIs
* Database Management
* Authentication & Authorization

---

## 👨‍💻 Author

**Chetan**

BTech Computer Science & Engineering

GitHub: [@DRE4MLIFT3R](https://github.com/DRE4MLIFT3R)

---

## 📄 License

This project is intended for **educational and research purposes**.

See the repository license for usage details.
