from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'allergies', views.AllergyViewSet, basename='allergy')
router.register(r'encounters', views.EncounterViewSet, basename='encounter')
# Advanced features
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'consultations', views.ConsultationViewSet, basename='consultation')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'lab-results', views.LabResultViewSet, basename='lab-result')
router.register(r'vital-signs', views.VitalSignsViewSet, basename='vital-signs')
router.register(r'medical-documents', views.MedicalDocumentViewSet, basename='medical-document')
router.register(r'referrals', views.ReferralViewSet, basename='referral')
# Medical Imaging & Interoperability
router.register(r'dicom-studies', views.DICOMStudyViewSet, basename='dicom-study')
router.register(r'dicom-series', views.DICOMSeriesViewSet, basename='dicom-series')
router.register(r'hl7-messages', views.HL7MessageViewSet, basename='hl7-message')
router.register(r'fhir-logs', views.FHIRResourceLogViewSet, basename='fhir-log')

urlpatterns = [
    # Auth endpoints
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("me/", views.UserProfileView.as_view(), name="auth-me"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    
    # Medical records
    path("medical-history/", views.MedicalHistoryView.as_view(), name="medical-history"),
    path("family-history/", views.FamilyHistoryView.as_view(), name="family-history"),
    path("insurance/", views.InsuranceView.as_view(), name="insurance"),
    path("advance-directive/", views.AdvanceDirectiveView.as_view(), name="advance-directive"),
    
    # Doctor/Patient management
    path("doctors/", views.DoctorListView.as_view(), name="doctor-list"),
    path("patients/", views.PatientListView.as_view(), name="patient-list"),
    
    # FHIR Export
    path("fhir/export/patient/", views.FHIRPatientExportView.as_view(), name="fhir-patient-export"),
    path("fhir/export/practitioner/", views.FHIRPractitionerExportView.as_view(), name="fhir-practitioner-export"),
    path("fhir/export/appointment/<int:pk>/", views.FHIRAppointmentExportView.as_view(), name="fhir-appointment-export"),
    path("fhir/export/consultation/<int:pk>/", views.FHIRServiceRequestExportView.as_view(), name="fhir-servicerequest-export"),
    path("fhir/servicerequests/", views.FHIRServiceRequestListView.as_view(), name="fhir-servicerequest-list"),
    
    # Router URLs
    path("", include(router.urls)),
]
