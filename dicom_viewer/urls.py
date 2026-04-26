from django.urls import path
from . import views

urlpatterns = [
    path('slice/', views.serve_slice, name='serve_slice'),
    path('segment/', views.segment_volume, name='segment_volume'),
    path('mpr/', views.mpr_slice, name='mpr_slice'),
    path('mpr-raw/', views.mpr_slice_raw, name='mpr_slice_raw'),
    path('generate-lab/', views.generate_lab, name='generate_lab'),
]
