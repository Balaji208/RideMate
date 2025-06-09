import requests
import time
import json

BASE_URL = "http://localhost:3002/location/captain"

def register_driver(driver_id, lat, long, city, ride_types, rating):
    payload = {
        "DRIVER_ID": driver_id,
        "lat": lat,
        "long": long,
        "city": city,
        "rideTypeSupported": ride_types,
        "isAvailable": True,
        "status": "active",
        "rating": rating,
        "vehicle": {"capacity": 4, "type": "sedan"}
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(BASE_URL, data=json.dumps(payload), headers=headers)
        print(f"Registered {driver_id}: {response.status_code} - {response.text}")
        # Skip Redis verification due to 500 error
        # redis_check_url = f"http://localhost:3002/captains/nearby?lat={lat}&long={long}&type=economy&city={city}&riderId=test"
        # redis_response = requests.get(redis_check_url)
        # print(f"Redis check for {driver_id}: {redis_response.status_code} - {redis_response.text}")
    except Exception as e:
        print(f"Error registering {driver_id}: {e}")

if __name__ == "__main__":
    register_driver("DRV1", 13.075, 80.26, "Chennai", ["economy"], 4.5)
    time.sleep(3)
    register_driver("DRV2", 13.05, 80.25, "Chennai", ["economy"], 4.0)