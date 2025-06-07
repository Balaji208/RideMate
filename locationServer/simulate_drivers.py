import requests
import json
import time

drivers = [
    {
        "DRIVER_ID": "DRV1",
        "lat": 13.0750,
        "long": 80.2600,
        "rideTypeSupported": ["economy"],
        "isAvailable": True,
        "status": "active",
        "rating": 4,
        "lastUpdated": int(time.time() * 1000),
        "city": "Chennai",
        "isPetFriendly": False,
        "vehicle": {"type": "sedan", "capacity": 4}
    },
    {
        "DRIVER_ID": "DRV2",
        "lat": 13.0500,
        "long": 80.2500,
        "rideTypeSupported": ["economy"],
        "isAvailable": True,
        "status": "active",
        "rating": 4,
        "lastUpdated": int(time.time() * 1000),
        "city": "Chennai",
        "isPetFriendly": False,
        "vehicle": {"type": "sedan", "capacity": 4}
    }
]

url = "http://localhost:3002/location/captain"
for driver in drivers:
    response = requests.post(url, json=driver)
    print(f"Registered {driver['DRIVER_ID']}: {response.status_code}, {response.text}")