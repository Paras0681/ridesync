from rest_framework import serializers
from .models import Rider, BikeInfo, Message


class RiderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rider
        fields = [
            "first_name", 
            "last_name",
            "rider_role",
        ]
        read_only_fields = [
            "first_name", 
            "last_name",
            "rider_role",
        ]


class BikeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeInfo
        fields = [
            "rider",
            "bikename",
            "numberplate",
            "insurance"
        ]


class RiderDetailSerializer(serializers.ModelSerializer):
    bikes = BikeInfoSerializer(many=True, read_only=True)
    class Meta:
        model = Rider
        fields = [
            "rider_id",
            "first_name", 
            "last_name",
            "email",
            "rider_role",
            "blood_group",
            "age",
            "weight",
            "height",
           "birth_date", 
            "bikes"
        ]

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.first_name", read_only=True)
    class Meta:
        model = Message
        fields = [
            "message_id", 
            "sender", 
            "sender_name", 
            "group", 
            "chat_message", 
            "message_type", 
            "created_at"
        ]
        read_only_fields = [
            "message_id", 
            "sender_name", 
            "created_at"
        ]

