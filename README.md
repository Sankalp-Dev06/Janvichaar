# JanVichaar 🎯
A real-time sentiment analysis and emotion detection platform analyzing public opinions from YouTube and Reddit using Transformer-based models.

## 🚀 Introduction

**JanVichaar** is a powerful sentiment analysis system that scrapes comments from popular social media platforms (YouTube and Reddit) and evaluates the emotional tone of the discussions. It leverages state-of-the-art Natural Language Processing models to classify comments as **positive**, **neutral**, or **negative**. The application is built with a clean frontend, robust backend, and a high-performing transformer model.

---

## 🧠 Features

- 🔍 Real-time sentiment detection from YouTube and Reddit comments
- 🤖 Transformer-based sentiment model 
- 📊 Dashboard with visual analytics and flowcharts
- 🌐 Fast and interactive UI built with modern web technologies
- 📦 Packaged for deployment and scalability

---

## 🛠️ Tech Stack

| Layer       | Technologies Used                                |
|------------|--------------------------------------------------|
| Frontend   | HTML, CSS, JavaScript                            |
| Backend    | Python, FastAPI                                  |
| Machine Learning | Transformers, PRAW (Reddit API), YouTube API |
| Visualization | Matplotlib, Seaborn, WordCloud                |
| Hosting    | GitHub Pages / Render     |

---

For emotion classification:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import torch

tokenizer = AutoTokenizer.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("cardiffnlp/twitter-roberta-base-sentiment")

def analyze_sentiment(text):
    encoded_input = tokenizer(text, return_tensors='pt', truncation=True)
    with torch.no_grad():
        output = model(**encoded_input)
    scores = softmax(output.logits.numpy()[0])
    labels = ['negative', 'neutral', 'positive']
    return labels[scores.argmax()], float(scores.max())
```

## 🔧 Installation & Usage

1. Clone the repository

```
git clone https://github.com/your-username/JanVichaar.git
cd JanVichaar
```
2. Install Dependencies

```
pip install -r requirements.txt
```

3. Run FastAPI Server

```
uvicorn backend.app:app --reload
```

4. Access the Frontend
Open ```index.html``` in your browser or serve it using a static file server.

## Screenshots





![WhatsApp Image 2025-04-06 at 23 39 09_56e47c18](https://github.com/user-attachments/assets/2de7561b-2cef-4198-8906-327bd2cfb816)



