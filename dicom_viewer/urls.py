from django.urls import path
from .views import list_dicoms, analyze_dicom

urlpatterns = [
    path('list/',    list_dicoms,    name='dicom-list'),
    path('analyze/', analyze_dicom,  name='dicom-analyze'),
]