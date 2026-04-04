import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
data = pd.read_csv("dataset.csv")

# Features (inputs)
X = data[["rain_mm","aqi","traffic","deliveries"]]

# Target (output)
y = data["disruption"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save trained model
joblib.dump(model,"risk_model.pkl")

print("Model trained and saved as risk_model.pkl")