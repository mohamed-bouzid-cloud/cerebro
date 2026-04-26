from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
<<<<<<< HEAD
    re_path(r'ws/waiting-room/$', consumers.WaitingRoomConsumer.as_asgi()),
=======
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
]
