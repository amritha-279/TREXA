import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib

data = pd.read_csv("income_dataset.csv")

X = data[["rain_mm","aqi","traffic","deliveries"]]
y = data["income_loss"]

X_train,X_test,y_train,y_test = train_test_split(
    X,y,test_size=0.2,random_state=42
)

model = RandomForestRegressor()

model.fit(X_train,y_train)

joblib.dump(model,"income_model.pkl")

print("Income model trained")