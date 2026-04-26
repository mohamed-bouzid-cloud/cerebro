from django.contrib import admin
from django.urls import path, include
from django.conf import settings # AJOUTE CECI
from django.conf.urls.static import static # AJOUTE CECI

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/dicom/', include('dicom_viewer.urls')),
] 

# AJOUTE CETTE LIGNE POUR SERVIR LES IMAGES .IMA
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)