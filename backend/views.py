from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Rider, BikeInfo, Message
from .serializers import (
    RiderListSerializer,
    RiderDetailSerializer,
    BikeInfoSerializer,
    MessageSerializer,
)


class RiderListView(APIView):

    def get(self, request):
        riders = Rider.objects.all()
        serializer = RiderListSerializer(riders, many=True)
        return Response(serializer.data)

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

        return Response(serializer.data)


class BikeListView(APIView):

    def get(self, request):
        bikes = BikeInfo.objects.all()
        serializer = BikeInfoSerializer(bikes, many=True)
        return Response(serializer.data)

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

class MessageListView(APIView):

    def get(self, request):
        messages = Message.objects.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MessageSerializer(data=request.data)
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