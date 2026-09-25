from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    RiderListView,
    RiderDetailView,
    BikeListView,
    MessageListView,
    NotificationsListView,
    UpdateMyLocationView,
    RiderLocationDetailView,
    GroupLocationView,
    MyGroups
)


urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view()),
    #rider and bike related endpoints
    path("riders/", RiderListView.as_view()),
    path("riders/<uuid:rider_id>/", RiderDetailView.as_view()),
    path("bikes/", BikeListView.as_view()),

    #chat enpoints
    path("messages/", MessageListView.as_view()),
    path("notifications/", NotificationsListView.as_view()),

    #location enpoints
    path("location/me/", UpdateMyLocationView.as_view()),
    path("locations/<uuid:rider_id>/", RiderLocationDetailView.as_view()),
    path("groups/<uuid:group_id>/locations/", GroupLocationView.as_view()),
    path("groups/mine/", MyGroups.as_view()),
]