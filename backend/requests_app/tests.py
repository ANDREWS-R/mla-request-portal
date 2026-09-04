from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import ConstituencyRequest, UserProfile, AppointmentSlot, Appointment
import datetime

class RequestAPITests(APITestCase):
    def setUp(self):
        # Create MLA user
        self.mla_user = User.objects.create_user(
            username='mla_test',
            password='Password123',
            email='mla@test.com'
        )
        self.mla_user.profile.role = 'MLA'
        self.mla_user.profile.constituency = 'Aluva'
        self.mla_user.profile.save()

        # Create Citizen user
        self.citizen_user = User.objects.create_user(
            username='citizen_test',
            password='Password123',
            email='citizen@test.com'
        )
        self.citizen_user.profile.role = 'CITIZEN'
        self.citizen_user.profile.constituency = 'Aluva'
        self.citizen_user.profile.save()

    def test_citizen_submit_request(self):
        # Log in as citizen
        self.client.force_authenticate(user=self.citizen_user)
        url = reverse('submit_request')
        data = {
            'submitter_name': 'Test Citizen',
            'submitter_email': 'citizen@test.com',
            'submitter_phone': '9999999999',
            'subject': 'Pothole on Main Road',
            'description': 'There is a huge pothole in front of the grocery store that needs tarring.'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ConstituencyRequest.objects.count(), 1)
        
        req = ConstituencyRequest.objects.first()
        self.assertEqual(req.subject, 'Pothole on Main Road')
        self.assertEqual(req.category, 'ROADS')  # Heuristic should match ROADS
        self.assertEqual(req.submitted_by, self.citizen_user)  # Check linked user

    def test_register_citizen(self):
        url = reverse('citizen_register')
        data = {
            'username': 'new_citizen',
            'password': 'NewPassword123',
            'email': 'new@citizen.com',
            'first_name': 'New',
            'last_name': 'Citizen',
            'phone': '9876543210'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(username='new_citizen')
        self.assertEqual(user.profile.role, 'CITIZEN')
        self.assertEqual(user.profile.phone, '9876543210')

    def test_appointment_booking_and_limits(self):
        # Create a slot
        slot = AppointmentSlot.objects.create(
            date=datetime.date.today() + datetime.timedelta(days=1),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            max_appointments=2  # Set limit to 2
        )
        
        self.client.force_authenticate(user=self.citizen_user)
        url = reverse('appointment-list')
        
        # 1. Book first appointment
        data1 = {
            'slot': slot.id,
            'citizen_name': 'Vaishnav Byju',
            'citizen_phone': '9876543210',
            'topic': 'Drainage repairs near my shop'
        }
        response1 = self.client.post(url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        
        # 2. Book second appointment (succeeds)
        data2 = {
            'slot': slot.id,
            'citizen_name': 'Mary Joseph',
            'citizen_phone': '9876543211',
            'topic': 'Electricity post replacement'
        }
        response2 = self.client.post(url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # 3. Book third appointment (fails due to limit)
        data3 = {
            'slot': slot.id,
            'citizen_name': 'Third Citizen',
            'citizen_phone': '9876543212',
            'topic': 'Education scholarship application'
        }
        response3 = self.client.post(url, data3, format='json')
        self.assertEqual(response3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("This slot is fully booked", str(response3.data[0]))
