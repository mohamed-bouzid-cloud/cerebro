#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import json

# Get or create a test user
user = User.objects.filter(email='test@example.com').first()
if not user:
    user = User.objects.create_user(email='test@example.com', password='testpass123', 
                                    first_name='Test', last_name='User', role='patient')

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print("=" * 60)
print("TEST API CREDENTIALS")
print("=" * 60)
print(f"User: {user.email} ({user.role})")
print(f"Access Token: {access_token[:50]}...")
print()
print("=" * 60)
print("API ENDPOINTS TO TEST")
print("=" * 60)
print(f"GET http://localhost:8001/api/auth/dicom-studies/")
print(f"GET http://localhost:8001/api/auth/hl7-messages/")
print(f"GET http://localhost:8001/api/auth/fhir-logs/")
print(f"GET http://localhost:8001/api/auth/fhir/export/patient/")
print()
print("Header to use:")
print(f"Authorization: Bearer {access_token}")
print("=" * 60)
