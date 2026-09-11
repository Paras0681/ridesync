from django.urls import path
from .views import (
    RiderListView,
    RiderDetailView,
    BikeListView,
    MessageListView,
)


urlpatterns = [
    path("riders/", RiderListView.as_view()),
    path("riders/<uuid:rider_id>/", RiderDetailView.as_view()),
    path("bikes/", BikeListView.as_view()),
    path("messages/", MessageListView.as_view()),
]