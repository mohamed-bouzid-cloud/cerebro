import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging between doctors and patients.
    Handles connection, disconnection, and message broadcasting.
    """
    
    async def connect(self):
        """Called when a WebSocket connection is established."""
        self.user_id = self.scope['user'].id
        self.room_name = f"chat_{self.user_id}"
        self.room_group_name = f"chat_group_{self.user_id}"
        
        # Verify user is authenticated
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        # Join the user's personal chat group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✓ User {self.user_id} connected to WebSocket")
    
    async def disconnect(self, close_code):
        """Called when a WebSocket connection is closed."""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"✗ User {self.user_id} disconnected from WebSocket")
    
    async def receive(self, text_data):
        """Called when data is received from the WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'send_message':
                await self.handle_send_message(data)
            elif message_type == 'mark_read':
                await self.handle_mark_read(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_send_message(self, data):
        """Handle incoming message from client."""
        recipient_id = data.get('recipient_id')
        subject = data.get('subject')
        content = data.get('content')
        
        if not all([recipient_id, subject, content]):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing required fields'
            }))
            return
        
        # Save message to database
        message = await self.save_message(self.user_id, recipient_id, subject, content)
        
        if message:
            # Notify recipient
            recipient_room = f"chat_group_{recipient_id}"
            await self.channel_layer.group_send(
                recipient_room,
                {
                    'type': 'new_message',
                    'message_id': message['id'],
                    'sender_id': self.user_id,
                    'sender_name': message['sender_name'],
                    'subject': subject,
                    'content': content,
                    'timestamp': message['created_at']
                }
            )
            
            # Acknowledge to sender
            await self.send(text_data=json.dumps({
                'type': 'message_sent',
                'message_id': message['id'],
                'timestamp': message['created_at']
            }))
    
    async def handle_mark_read(self, data):
        """Handle marking a message as read."""
        message_id = data.get('message_id')
        
        if message_id:
            await self.mark_message_read(message_id)
            
            # Notify sender
            await self.send(text_data=json.dumps({
                'type': 'message_read',
                'message_id': message_id
            }))
    
    async def handle_typing(self, data):
        """Handle typing indicator."""
        recipient_id = data.get('recipient_id')
        is_typing = data.get('is_typing')
        
        if recipient_id:
            recipient_room = f"chat_group_{recipient_id}"
            await self.channel_layer.group_send(
                recipient_room,
                {
                    'type': 'user_typing',
                    'user_id': self.user_id,
                    'is_typing': is_typing
                }
            )
    
    # Handler methods for group messages
    async def new_message(self, event):
        """Send new message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message_id': event['message_id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'subject': event['subject'],
            'content': event['content'],
            'timestamp': event['timestamp']
        }))
    
    async def message_read(self, event):
        """Notify that message was read."""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_id': event['message_id']
        }))
    
    async def user_typing(self, event):
        """Notify that user is typing."""
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))
    
    # Database operations (must run in sync context)
    @database_sync_to_async
    def save_message(self, sender_id, recipient_id, subject, content):
        """Save message to database."""
        try:
            sender = User.objects.get(id=sender_id)
            recipient = User.objects.get(id=recipient_id)
            
            message = Message.objects.create(
                sender=sender,
                recipient=recipient,
                subject=subject,
                content=content
            )
            
            return {
                'id': message.id,
                'sender_name': sender.get_full_name(),
                'created_at': message.created_at.isoformat()
            }
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Mark message as read in database."""
        try:
            message = Message.objects.get(id=message_id)
            message.read = True
            message.save()
            return True
        except Message.DoesNotExist:
            return False


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications (appointments, consultations, etc).
    """
    
    async def connect(self):
        """Called when a WebSocket connection is established."""
        self.user_id = self.scope['user'].id
        self.notification_group_name = f"notifications_{self.user_id}"
        
        # Verify user is authenticated
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        # Join the user's notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✓ User {self.user_id} subscribed to notifications")
    
    async def disconnect(self, close_code):
        """Called when a WebSocket connection is closed."""
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )
    
    async def notification(self, event):
        """Send notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event['message'],
            'notification_type': event.get('notification_type', 'info'),
            'timestamp': event.get('timestamp')
        }))
    
    async def consultation_request(self, event):
        """Send consultation request notification."""
        await self.send(text_data=json.dumps({
            'type': 'consultation_request',
            'consultation_id': event['consultation_id'],
            'from_user': event['from_user'],
            'reason': event['reason'],
            'timestamp': event.get('timestamp')
        }))
    
    async def appointment_reminder(self, event):
        """Send appointment reminder notification."""
        await self.send(text_data=json.dumps({
            'type': 'appointment_reminder',
            'appointment_id': event['appointment_id'],
            'doctor_name': event.get('doctor_name'),
            'scheduled_at': event.get('scheduled_at'),
            'minutes_until': event.get('minutes_until')
        }))
