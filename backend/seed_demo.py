import requests

B = "http://localhost:8000"
H = {"X-Role": "ADMIN", "X-User": "seed"}

for f, t, n, q in [
    ("PHC Sanand", "ICU Bed", "ICU Bed", 2), ("CHC Bavla", "ICU Bed", "ICU Bed", 0),
    ("District Hospital Ahmedabad", "ICU Bed", "ICU Bed", 5),
    ("District Hospital Ahmedabad", "Ambulance", "Ambulance A1", 1),
    ("CHC Bavla", "Diagnostic", "X-Ray Room", 1),
]:
    requests.post(f"{B}/resources/", json={"facility_name": f, "resource_type": t, "resource_name": n, "quantity": q}, headers=H)

for name, age, g, ph, abha in [
    ("Sita Devi", 34, "Female", "9876543210", "12345678901234"),
    ("Ramesh Patel", 58, "Male", "9123456780", "22345678901234"),
    ("Baby Kavya", 2, "Female", "9988776655", "32345678901234"),
]:
    r = requests.post(f"{B}/patients/", json={"name": name, "age": age, "gender": g, "phone": ph, "abha_id": abha}, headers=H)
    if r.ok:
        pid = r.json()["patient_id"]
        requests.post(f"{B}/consents/", json={"patient_id": pid}, headers=H)
        requests.post(f"{B}/referrals/", json={
            "patient_id": pid, "from_facility": "PHC Sanand", "to_facility": "District Hospital Ahmedabad",
            "reason": "Needs specialist evaluation", "service_required": "Cardiology",
            "priority": "URGENT" if age > 50 else "ROUTINE"}, headers=H)
print("Seeded.")
