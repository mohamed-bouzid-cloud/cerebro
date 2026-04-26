import requests
import json

def test_doctors_api():
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {"email": "tony@stark.com", "password": "password123"}
    
    try:
        response = requests.post(login_url, json=login_data)
        response.raise_for_status()
        data = response.json()
        tokens = data.get("tokens")
        
        if not tokens:
            print("Login failed, no tokens found.")
            return

        headers = {"Authorization": f"Bearer {tokens['access']}"}
        doctors_url = "http://localhost:8000/api/auth/doctors/"
        doctors_res = requests.get(doctors_url, headers=headers)
        doctors_res.raise_for_status()
        
        doctors = doctors_res.json()
        print(f"Total doctors found: {len(doctors)}")
        for doc in doctors:
            print(f"- {doc['email']} ({doc.get('first_name')} {doc.get('last_name')})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_doctors_api()
