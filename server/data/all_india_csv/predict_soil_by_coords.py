
import numpy as np
import joblib
import os

def predict_soil_by_coordinates(latitude, longitude, model_path="soil_knn_model.pkl"):
    """
    Predicts the soil type for given latitude and longitude using a pre-trained KNN model.

    Args:
        latitude (float): The latitude of the location.
        longitude (float): The longitude of the location.
        model_path (str): The path to the saved KNN model (.pkl file).
    """
    if not os.path.exists(model_path):
        print(f"❌ Error: Model file '{model_path}' not found.")
        print("Please ensure the 'soil_knn_model.pkl' is in the same directory or provide the correct path.")
        return

    # Load the trained model
    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(f"❌ Error loading model from '{model_path}': {e}")
        return

    # Convert to radians because the model was trained with metric='haversine'
    point_rad = np.radians([[latitude, longitude]])
    soil = model.predict(point_rad)[0]

    print(f"📍 Location: Latitude={latitude}, Longitude={longitude}")
    print(f"🌱 Predicted Soil Type: {soil}")

if __name__ == "__main__":
    print("--- Soil Prediction by Coordinates Script ---")
    print("This script uses a pre-trained KNN model to predict soil types based on latitude and longitude.")
    print("Ensure 'soil_knn_model.pkl' is in the same directory as this script, or specify its path.")
    print("
Example predictions:")
    # Example coordinates from the dataset (first row from df.head() in the notebook)
    predict_soil_by_coordinates(17.691, 82.9992) # Anakapalli (red)
    predict_soil_by_coordinates(15.9042, 80.4676) # Bapatla (black)
    predict_soil_by_coordinates(22.2361795, 83.3529534) # Raigarh (red, from previous run)
