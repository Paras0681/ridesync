from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination

from .models import Rider, RiderLocation, BikeInfo, Message
from .serializers import (
    RiderListSerializer,
    RiderDetailSerializer,
    BikeInfoSerializer,
    MessageSerializer,
    RiderLocationSerializer,
    UpdateLocationSerializer
)

# Rider and Biker related views
class RiderListView(APIView):

    def get(self, request):
        riders = Rider.objects.all()
        serializer = RiderListSerializer(riders, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class RiderDetailView(APIView):

    def get(self, request, rider_id):
        try:
            rider = Rider.objects.get(rider_id=rider_id)
        except Rider.DoesNotExist:
            return Response(
                {
                    "detail": "Rider not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = RiderDetailSerializer(rider)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class RiderLocationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, rider_id):
        location = RiderLocation.objects.filter(
            rider__rider_id = rider_id
        ).select_related("rider").order_by("-updated_at").first()
        if not location:
            return Response(
                {
                    "detail": "No location data"
                },
                status=status.HTTP_404_NOT_FOUND 
            )
        return Response(RiderLocationSerializer(location).data, status=status.HTTP_200_OK)


class UpdateMyLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = UpdateLocationSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        rider = request.user.rider_profile
        defaults = {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
        }
        if "status" in data:
            defaults["status"] = data["status"]
 
        location, _ = RiderLocation.objects.update_or_create(
            rider=rider,
            defaults=defaults,
        )
        return Response(RiderLocationSerializer(location).data, status=status.HTTP_200_OK)


class GroupLocationView(APIView):
    def get(self, request, group_id):
        locations = RiderLocation.objects.filter(
            rider__groups__group_id=group_id
        ).select_related("rider")
        return Response(
            RiderLocationSerializer(locations, many=True).data,
            status=status.HTTP_200_OK,
        )


class BikeListView(APIView):

    def get(self, request):
        bikes = BikeInfo.objects.all()
        serializer = BikeInfoSerializer(bikes, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = BikeInfoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

# Chats and notification related views
class MessageListView(APIView):

    def get(self, request):
        messages = Message.objects.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                sender=request.user.rider_profile
            )
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class MessageCursorPagination(CursorPagination):
    page_size = 20
    ordering = ("-created_at", "-id")

class NotificationsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessageCursorPagination

    def get(self, request):
        notifications = Message.objects.filter(
            message_type="NOTIFICATION",
            group__members=request.user.rider,
        )
        serialzer = MessageSerializer(notifications, many=True)
        return Response(
            serialzer.data,
            status=status.HTTP_200_OK
        )

# Location related views