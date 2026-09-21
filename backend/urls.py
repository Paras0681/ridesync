from django.urls import path
from .views import (
    RiderListView,
    RiderDetailView,
    BikeListView,
    MessageListView,
    NotificationsListView,
    UpdateMyLocationView,
    RiderLocationDetailView,
    GroupLocationView
)


urlpatterns = [
    #rider and bike related endpoints
    path("riders/", RiderListView.as_view()),
    path("riders/<uuid:rider_id>/", RiderDetailView.as_view()),
    path("bikes/", BikeListView.as_view()),

    #chat enpoints
    path("messages/", MessageListView.as_view()),
    path("notifications/", NotificationsListView.as_view()),

    #location enpoints
    path("location/me", UpdateMyLocationView.as_view()),
    path("locations/<uuid:rider_id>/", RiderLocationDetailView.as_view()),
    path("groups/<uuid:group_id>/locations/", GroupLocationView.as_view()),
]