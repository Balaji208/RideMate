import requests
import json

def register_driver(driver_id, lat, long, city, ride_types, rating):
    url = "http://localhost:3002/location/captain"
    headers = {"Content-Type": "application/json"}
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
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Registered {driver_id}: {response.status_code} {response.text}")

# Register drivers for test case
register_driver("DRV1", 13.075, 80.26, "Chennai", ["economy"], 4.0)
register_driver("DRV2", 13.05, 80.25, "Chennai", ["economy"], 4.0)