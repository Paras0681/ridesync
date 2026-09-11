from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Rider(models.Model):
    class Riderrole(models.TextChoices):
        GROUP_LEADER = "Group Leader", "group leader"
        RIDER = "Rider", "rider"

    class BloodGroup(models.TextChoices):
        SELECT = "Select", "select"
        O_NEGATIVE = "O-", "o-",
        O_POSITIVE = "O+", "o+",
        A_NEGATIVE = "A-", "a-",
        A_POSITIVE = "A+", "A+",
        B_NEGATIVE = "B-", "b-",
        B_POSITIVE = "B+", "b+",
        AB_NEGATIVE = "AB-", "ab-",
        AB_POSITIVE = "AB+", "ab+",
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='users')
    rider_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(editable=False, unique=True)
    rider_role = models.TextField(choices=Riderrole.choices, default=Riderrole.RIDER)
    blood_group = models.CharField(max_length=10, choices=BloodGroup.choices, blank=True, null=True)
    age = models.PositiveIntegerField(validators=[MinValueValidator(18), MaxValueValidator(60)])
    weight = models.IntegerField(null=False)
    height = models.IntegerField(null=False)
    birth_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "riders"
        verbose_name = "Rider"
        verbose_name_plural = "Riders"
        indexes = [
            models.Index(fields=['first_name', '-created_at']),
        ]


class RiderLocation(models.Model):
    class Status(models.TextChoices):
        REST = "REST", "rest"
        FUELLING = "FUELLING", "fuelling"
        ONROAD = "ONROAD", "onroad"
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name="locations")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REST)


class BikeInfo(models.Model):
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name="bikes")
    numberplate = models.CharField(max_length=10)
    bikename = models.CharField(max_length=20, default="mybike")
    documents = models.URLField()
    insurance = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bikeinfos"
        verbose_name = "BikeInfo"
        verbose_name_plural = "BikeInfos"
        indexes = [
            models.Index(fields=['rider_id', 'created_at']),
        ]


class Group(models.Model):
    group_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_by = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name="created_groups")
    group_name = models.CharField(max_length=20, unique=True)
    members = models.ManyToManyField(Rider, through="GroupMembership", related_name="groups")
    class Meta:
        db_table = "groups"
        verbose_name = "Group"
        verbose_name_plural = "Groups"
        indexes = [
            models.Index(fields=['group_id', '-group_name']),
        ]


class GroupMembership(models.Model):
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("rider", "group")


class Message(models.Model):
    class MessageType(models.TextChoices):
        MESSAGE = "MESSAGE", "message"
        NOTIFICATION = "NOTIFICATION", "notification"
        ALERT = "ALERT", "alert"
    message_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    sender = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name="sent_messages")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="messages")
    chat_message = models.CharField(max_length=250)
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.MESSAGE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        indexes = [models.Index(fields=['message_id', '-created_at'])]

