from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('MLA', 'MLA'),
        ('STAFF', 'Staff'),
        ('CITIZEN', 'Citizen'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN')
    constituency = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    instance.profile.save()


class ConstituencyRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('ESCALATED', 'Escalated'),
    ]
    
    URGENCY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    
    CATEGORY_CHOICES = [
        ('ROADS', 'Roads & Transport'),
        ('WATER', 'Water Supply'),
        ('ELECTRICITY', 'Electricity & Power'),
        ('HEALTH', 'Healthcare & Sanitation'),
        ('EDUCATION', 'Education & Schools'),
        ('FINANCIAL_AID', 'Financial Aid'),
        ('OTHER', 'Other'),
    ]

    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_requests')
    submitter_name = models.CharField(max_length=100, blank=True, null=True)
    submitter_email = models.EmailField(blank=True, null=True)
    submitter_phone = models.CharField(max_length=20, blank=True, null=True)
    
    subject = models.CharField(max_length=200)
    description = models.TextField()  # Original text submitted
    translation = models.TextField(blank=True, null=True)  # Translated text to common language
    summary = models.TextField(blank=True, null=True)  # AI-generated summary
    source_language = models.CharField(max_length=20, default='en')  # Auto-detected language
    
    # Classification fields
    constituency = models.CharField(max_length=100, blank=True, null=True)  # Place/Constituency classified
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')  # Problem type
    custom_category = models.CharField(max_length=100, blank=True, null=True)  # Custom department if category is OTHER
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='MEDIUM')  # Urgency level
    
    # Filtering / Fraud Flags
    is_spam = models.BooleanField(default=False)
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicates')
    
    # Workflow fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    assigned_staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests')
    
    # File attachments
    voice_file = models.FileField(upload_to='voice_requests/', blank=True, null=True)
    attachment_file = models.FileField(upload_to='attachments/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subject} ({self.status})"


class RequestComment(models.Model):
    request = models.ForeignKey(ConstituencyRequest, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on Request {self.request.id}"


class ConstituencyBudget(models.Model):
    project_name = models.CharField(max_length=200)
    constituency = models.CharField(max_length=100, default='Aluva')
    category = models.CharField(max_length=20, choices=ConstituencyRequest.CATEGORY_CHOICES, default='OTHER')
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    resolution_time_days = models.IntegerField(default=14)  # Average resolution/completion time
    description = models.TextField(blank=True, null=True)
    financial_year = models.CharField(max_length=20, default='2025-2026')

    def __str__(self):
        return f"{self.project_name} ({self.category})"


class AppointmentSlot(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_appointments = models.IntegerField(default=3)  # Maximum citizens per hour limit
    is_cancelled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.date} @ {self.start_time} - {self.end_time} ({'Cancelled' if self.is_cancelled else 'Active'})"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('BOOKED', 'Booked'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
    ]

    slot = models.ForeignKey(AppointmentSlot, on_delete=models.CASCADE, related_name='bookings')
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    citizen_name = models.CharField(max_length=100)
    citizen_phone = models.CharField(max_length=20)
    topic = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BOOKED')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment: {self.citizen_name} - {self.topic} ({self.status})"
