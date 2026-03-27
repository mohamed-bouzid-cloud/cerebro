from django.contrib import admin
from django.urls import path, include
<<<<<<< HEAD
=======
from django.conf import settings # AJOUTE CECI
from django.conf.urls.static import static # AJOUTE CECI
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
<<<<<<< HEAD
]
=======
    path('api/dicom/', include('dicom_viewer.urls')),
] 

# AJOUTE CETTE LIGNE POUR SERVIR LES IMAGES .IMA
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
