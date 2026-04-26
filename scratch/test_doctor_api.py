import requests
import json

def test_doctor_dashboard_api():
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {"email": "l@gmail.com", "password": "password123"}
    
    try:
        response = requests.post(login_url, json=login_data)
        response.raise_for_status()
        data = response.json()
        tokens = data.get("tokens")
        
        if not tokens:
            print("Login failed, no tokens found.")
            return

        headers = {"Authorization": f"Bearer {tokens['access']}"}
        
        # Test appointments
        appt_url = "http://localhost:8000/api/auth/appointments/"
        appt_res = requests.get(appt_url, headers=headers)
        appt_res.raise_for_status()
        appts = appt_res.json()
        print(f"Appointments found: {len(appts)}")
        
        # Test patients
        patients_url = "http://localhost:8000/api/auth/patients/"
        patients_res = requests.get(patients_url, headers=headers)
        patients_res.raise_for_status()
        patients = patients_res.json()
        print(f"Patients found: {len(patients)}")
        for p in patients:
            print(f"- {p['email']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_doctor_dashboard_api()
