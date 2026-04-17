from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

risk_model = joblib.load("risk_model.pkl")
income_model = joblib.load("income_model.pkl")


@app.route("/")
def home():
    return "ML Service Running"


@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    rain = data["rain"]
    aqi = data["aqi"]
    traffic = data["traffic"]
    deliveries = data["deliveries"]

    input_data = np.array([[rain,aqi,traffic,deliveries]])

    prediction = risk_model.predict(input_data)

    return jsonify({
        "disruption_risk": float(prediction[0])
    })


@app.route("/predict-income", methods=["POST"])
def predict_income():

    data = request.json

    rain = data["rain"]
    aqi = data["aqi"]
    traffic = data["traffic"]
    deliveries = data["deliveries"]

    input_data = np.array([[rain,aqi,traffic,deliveries]])

    prediction = income_model.predict(input_data)

    return jsonify({
        "income_loss": float(prediction[0])
    })


app.run(port=5000, debug=False)