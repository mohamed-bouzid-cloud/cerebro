from django.urls import path
from . import views

urlpatterns = [
    path('slice/', views.serve_slice, name='serve_slice'),
    path('segment/', views.segment_volume, name='segment_volume'),
]
