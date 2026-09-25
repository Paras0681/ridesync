from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Rider, RiderLocation, BikeInfo, Message, Group

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        try:
            data["rider_id"] = str(self.user.rider_profile.rider_id)
        except AttributeError:
            data["rider_id"] = None
        return data

class RiderListSerializer(serializers.ModelSerializer):
    """
    Serializer to fetch riders data.
    """
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
    """
    Serializer to fetch bike data of the rider
    """
    class Meta:
        model = BikeInfo
        fields = [
            "rider",
            "bikename",
            "numberplate",
            "insurance"
        ]


class RiderDetailSerializer(serializers.ModelSerializer):
    """
    Serializer to fetch rider-detail data for the users
    """
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
    """
    Serializer to fetch chats i.e message data for the users
    """
    sender_name = serializers.CharField(
        source="sender.first_name",
        read_only=True
    )

    group = serializers.SlugRelatedField(
        slug_field="group_name",
        queryset=Group.objects.all()
    )

    class Meta:
        model = Message
        fields = [
            "message_id",
            "sender",
            "sender_name",
            "group",
            "chat_message",
            "message_type",
            "created_at",
        ]
        read_only_fields = [
            "message_id",
            "sender_name",
            "created_at",
            "sender",
        ]


class RiderLocationSerializer(serializers.ModelSerializer):
    """
    Serializer to get lat/long data of the rider.
    """
    rider_id = serializers.UUIDField(source="rider.rider_id", read_only=True)
    rider_name = serializers.CharField(source="rider.first_name", read_only=True)

    class Meta:
        model = RiderLocation
        fields = [
            "rider_id", 
            "rider_name", 
            "latitude", 
            "longitude", 
            "status", 
            "updated_at"
        ]
        read_only_fields = [
            "rider_id", 
            "rider_name", 
            "updated_at"
        ]


class UpdateLocationSerializer(serializers.Serializer):
    """
    Input-only serializer to post the rider location.
    """
    latitude = serializers.DecimalField(max_digits=17, decimal_places=15)
    longitude = serializers.DecimalField(max_digits=17, decimal_places=15)
    status = serializers.ChoiceField(choices=RiderLocation.Status.choices, required=False)


class MyGroupsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields=["group_id", "group_name"]