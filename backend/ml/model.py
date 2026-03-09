import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import warnings
warnings.filterwarnings('ignore')

def prepare_data(prices, lookback=60):
    # Extract closing prices in chronological order
    closes = [p["close"] for p in reversed(prices)]
    closes = np.array(closes).reshape(-1, 1)

    # Scale prices between 0 and 1
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(closes)

    X, y = [], []
    for i in range(lookback, len(scaled)):
        X.append(scaled[i-lookback:i, 0])
        y.append(scaled[i, 0])

    X = np.array(X)
    y = np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))

    return X, y, scaler, scaled

def build_model(lookback=60):
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=(lookback, 1)))
    model.add(Dropout(0.2))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(units=25))
    model.add(Dense(units=1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def predict_prices(prices, days=7):
    if len(prices) < 61:
        return {"error": "Not enough price data to predict"}

    lookback = 60
    X, y, scaler, scaled = prepare_data(prices, lookback)

    model = build_model(lookback)
    model.fit(X, y, batch_size=32, epochs=10, verbose=0)

    # Use last 60 days to predict next 7
    last_60 = scaled[-lookback:]
    predictions = []

    current_input = last_60.copy()

    for _ in range(days):
        input_data = np.reshape(current_input, (1, lookback, 1))
        pred = model.predict(input_data, verbose=0)
        predictions.append(pred[0][0])
        current_input = np.append(current_input[1:], pred)
        current_input = current_input.reshape(-1, 1)

    # Convert scaled predictions back to real prices
    predicted_prices = scaler.inverse_transform(
        np.array(predictions).reshape(-1, 1)
    ).flatten().tolist()

    return {
        "predictions": [round(p, 2) for p in predicted_prices],
        "days": days
    }