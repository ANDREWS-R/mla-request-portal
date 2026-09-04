from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
import datetime

from .models import ConstituencyRequest, RequestComment, UserProfile, ConstituencyBudget, AppointmentSlot, Appointment
from .serializers import (
    ConstituencyRequestSerializer,
    RequestCommentSerializer,
    UserSerializer,
    CitizenRegisterSerializer,
    ConstituencyBudgetSerializer,
    AppointmentSlotSerializer,
    AppointmentSerializer
)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.profile.role
        token['constituency'] = user.profile.constituency
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.profile.role,
            'constituency': self.user.profile.constituency
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CitizenRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CitizenRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Citizen registered successfully!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsMLA(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'MLA'
        )


class IsStaffOrMLA(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role in ['MLA', 'STAFF']
        )


class CitizenRequestSubmitView(APIView):
    # Support submission both from anonymous (if they want) and logged-in citizens
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        serializer = ConstituencyRequestSerializer(data=request.data)
        if serializer.is_valid():
            submitted_by_user = request.user if request.user.is_authenticated else None
            
            # Save request with constituency if present
            constituency = request.data.get('constituency')
            if not constituency and submitted_by_user and hasattr(submitted_by_user, 'profile'):
                constituency = submitted_by_user.profile.constituency
                
            if constituency:
                serializer.save(submitted_by=submitted_by_user, constituency=constituency)
            else:
                serializer.save(submitted_by=submitted_by_user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestViewSet(viewsets.ModelViewSet):
    serializer_class = ConstituencyRequestSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        # Allow citizens to create and read their own requests
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsStaffOrMLA()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ConstituencyRequest.objects.all().order_by('-created_at')
        
        # Role Filters
        if user.profile.role == 'CITIZEN':
            # Citizens only see requests they submitted
            queryset = queryset.filter(submitted_by=user)
        elif user.profile.role == 'STAFF':
            # Staff filters by constituency
            if user.profile.constituency:
                queryset = queryset.filter(
                    Q(constituency__iexact=user.profile.constituency) | 
                    Q(assigned_staff=user)
                )
        elif user.profile.role == 'MLA':
            if user.profile.constituency:
                queryset = queryset.filter(constituency__iexact=user.profile.constituency)

        # Filters: spam and duplicate filters (Toggleable by MLA/Staff)
        clean_view = self.request.query_params.get('clean_view', None)
        if clean_view == 'true' and user.profile.role in ['MLA', 'STAFF']:
            queryset = queryset.filter(is_spam=False, is_duplicate=False)
            
        assigned_to_me = self.request.query_params.get('assigned_to_me', None)
        if assigned_to_me == 'true':
            queryset = queryset.filter(assigned_staff=user)
            
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) | 
                Q(description__icontains=search) | 
                Q(submitter_name__icontains=search)
            )
            
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
            
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        urgency = self.request.query_params.get('urgency', None)
        if urgency:
            queryset = queryset.filter(urgency=urgency)

        return queryset

    def perform_update(self, serializer):
        user = self.request.user
        if user.profile.role == 'STAFF':
            assigned_staff = self.request.data.get('assigned_staff')
            if assigned_staff and int(assigned_staff) != user.id:
                raise permissions.exceptions.PermissionDenied("Staff members can only assign requests to themselves.")
        
        request_obj = serializer.save()
        
        # Automatically update all requests in the same duplicate group
        original = request_obj.duplicate_of if request_obj.is_duplicate and request_obj.duplicate_of else request_obj
        group_qs = ConstituencyRequest.objects.filter(
            Q(id=original.id) | Q(duplicate_of=original)
        ).exclude(id=request_obj.id)
        
        for other_req in group_qs:
            other_req.status = request_obj.status
            other_req.urgency = request_obj.urgency
            other_req.assigned_staff = request_obj.assigned_staff
            other_req.save()


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = RequestCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RequestComment.objects.all().order_by('created_at')

    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)
        
        # Automatically propagate comment to same type of requests (duplicates)
        req = comment.request
        original = req.duplicate_of if req.is_duplicate and req.duplicate_of else req
        
        # Get all other requests in the duplicate group
        group_qs = ConstituencyRequest.objects.filter(
            Q(id=original.id) | Q(duplicate_of=original)
        ).exclude(id=req.id)
        
        for other_req in group_qs:
            if not RequestComment.objects.filter(request=other_req, text=comment.text, user=self.request.user).exists():
                RequestComment.objects.create(
                    request=other_req,
                    text=comment.text,
                    user=self.request.user
                )


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = ConstituencyBudgetSerializer
    queryset = ConstituencyBudget.objects.all().order_by('category')

    def get_permissions(self):
        # Open budgets viewable on homepage to anyone
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffOrMLA()]


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSlotSerializer
    
    def get_queryset(self):
        # Return slots from today onwards (except for MLA/Staff who see all)
        user = self.request.user
        if user.is_authenticated and user.profile.role in ['MLA', 'STAFF']:
            return AppointmentSlot.objects.all().order_by('date', 'start_time')
        return AppointmentSlot.objects.filter(date__gte=datetime.date.today(), is_cancelled=False).order_by('date', 'start_time')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffOrMLA()]

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrMLA])
    def cancel_slot(self, request, pk=None):
        slot = self.get_object()
        slot.is_cancelled = True
        slot.save()
        # Cancel all booked appointments on this slot
        slot.bookings.filter(status='BOOKED').update(status='CANCELLED', notes="Cancelled by office administrator.")
        return Response({'status': 'Slot and all bookings cancelled.'})

    @action(detail=False, methods=['post'], permission_classes=[IsStaffOrMLA])
    def generate_defaults(self, request):
        try:
            days = int(request.data.get('days', 7))
        except (ValueError, TypeError):
            days = 7
            
        today = datetime.date.today()
        created_count = 0
        
        # Default hourly time slots from 10:00 to 16:00 (6 sessions per day)
        default_times = [
            (datetime.time(10, 0), datetime.time(11, 0)),
            (datetime.time(11, 0), datetime.time(12, 0)),
            (datetime.time(12, 0), datetime.time(13, 0)),
            (datetime.time(13, 0), datetime.time(14, 0)),
            (datetime.time(14, 0), datetime.time(15, 0)),
            (datetime.time(15, 0), datetime.time(16, 0)),
        ]
        
        # Generate slots for next N days (skipping Sunday)
        for i in range(1, days + 1):
            slot_date = today + datetime.timedelta(days=i)
            if slot_date.weekday() == 6:  # Sunday
                continue
                
            for start, end in default_times:
                exists = AppointmentSlot.objects.filter(
                    date=slot_date, 
                    start_time=start, 
                    end_time=end
                ).exists()
                
                if not exists:
                    AppointmentSlot.objects.create(
                        date=slot_date,
                        start_time=start,
                        end_time=end,
                        max_appointments=4  # Increase number of appointments per hour to 4
                    )
                    created_count += 1
                    
        return Response({'status': 'success', 'message': f'Generated {created_count} default slots for the next {days} days.'})



class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role in ['MLA', 'STAFF']:
            return Appointment.objects.all().order_by('slot__date', 'slot__start_time')
        return Appointment.objects.filter(citizen=user).order_by('slot__date', 'slot__start_time')

    def perform_create(self, serializer):
        slot = serializer.validated_data['slot']
        # 1. Check slot validity
        if slot.is_cancelled:
            raise serializers.ValidationError("This appointment slot has been cancelled.")
            
        # 2. Check slots limit per hour
        active_bookings = slot.bookings.filter(status='BOOKED').count()
        if active_bookings >= slot.max_appointments:
            raise serializers.ValidationError("This slot is fully booked. Please select another slot.")
            
        # 3. Save with user reference
        serializer.save(citizen=self.request.user, status='BOOKED')

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrMLA])
    def reschedule_appointment(self, request, pk=None):
        appointment = self.get_object()
        new_slot_id = request.data.get('new_slot')
        if not new_slot_id:
            return Response({'error': 'New slot ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            new_slot = AppointmentSlot.objects.get(id=new_slot_id)
        except AppointmentSlot.DoesNotExist:
            return Response({'error': 'New slot not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Check space in new slot
        active_bookings = new_slot.bookings.filter(status='BOOKED').count()
        if active_bookings >= new_slot.max_appointments:
            return Response({'error': 'Target slot is fully booked'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.slot = new_slot
        appointment.status = 'RESCHEDULED'
        appointment.notes = request.data.get('notes', 'Rescheduled by office administrator.')
        appointment.save()
        return Response({'status': 'Appointment rescheduled successfully.'})


class PublicMetricsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        total_requests = ConstituencyRequest.objects.filter(is_spam=False).count()
        resolved_requests = ConstituencyRequest.objects.filter(status='RESOLVED', is_spam=False).count()
        
        # Add realistic base offset to simulate state-wide Kerala data
        simulated_total = total_requests + 2450
        simulated_resolved = resolved_requests + 2080
        resolution_rate = int((simulated_resolved / simulated_total * 100)) if simulated_total > 0 else 85
        
        # Budget overview allocations sum
        budgets = ConstituencyBudget.objects.all()
        total_allocated = budgets.aggregate(Sum('allocated_amount'))['allocated_amount__sum'] or 25000000.00
        total_spent = budgets.aggregate(Sum('spent_amount'))['spent_amount__sum'] or 19500000.00
        
        # Categories breakdown pie
        category_counts = ConstituencyRequest.objects.filter(is_spam=False).values('category').annotate(count=Count('id'))
        category_labels = dict(ConstituencyRequest.CATEGORY_CHOICES)
        category_list = [{
            'label': category_labels.get(item['category'], item['category']),
            'count': item['count']
        } for item in category_counts]
        
        budget_list = []
        if budgets.exists():
            for b in budgets:
                budget_list.append({
                    'project': b.project_name,
                    'allocated': float(b.allocated_amount),
                    'spent': float(b.spent_amount),
                    'category': b.get_category_display(),
                    'constituency': b.constituency,
                    'time_days': b.resolution_time_days
                })
        
        # Append resolved citizen requests to the list of completed projects
        resolved_requests_qs = ConstituencyRequest.objects.filter(status='RESOLVED', is_spam=False)
        for r in resolved_requests_qs:
            res_time = 10
            if r.updated_at and r.created_at:
                delta = (r.updated_at - r.created_at).days
                if delta > 0:
                    res_time = delta
            
            budget_list.append({
                'project': f"Grievance: {r.subject}",
                'allocated': 0.00,
                'spent': 0.00,
                'category': r.get_category_display(),
                'constituency': r.constituency or 'Aluva',
                'time_days': res_time
            })
        else:
            if not budget_list:
                # Seed default mockup budget stats
                budget_list = [
                    {'project': 'Aluva Bridge Repair', 'allocated': 8000000, 'spent': 7800000, 'category': 'Roads & Transport', 'constituency': 'Aluva', 'time_days': 20},
                    {'project': 'Desom Ward Water Pipes', 'allocated': 6000000, 'spent': 5200000, 'category': 'Water Supply', 'constituency': 'Aluva', 'time_days': 15},
                    {'project': 'Primary Health Centre Ward 4', 'allocated': 7000000, 'spent': 4500000, 'category': 'Healthcare & Sanitation', 'constituency': 'Aluva', 'time_days': 30},
                    {'project': 'Smart Classrooms Aluva School', 'allocated': 4000000, 'spent': 3800000, 'category': 'Education & Schools', 'constituency': 'Aluva', 'time_days': 10},
                ]

        return Response({
            'total_requests': simulated_total,
            'resolution_rate': resolution_rate,
            'total_allocated': float(total_allocated),
            'total_spent': float(total_spent),
            'category_counts': category_list if len(category_list) > 0 else [
                {'label': 'Roads & Transport', 'count': 45},
                {'label': 'Water Supply', 'count': 32},
                {'label': 'Electricity & Power', 'count': 25},
                {'label': 'Healthcare & Sanitation', 'count': 18},
                {'label': 'Financial Aid', 'count': 22}
            ],
            'projects_budget': budget_list
        })


class StaffManagementViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsMLA]
    
    def get_queryset(self):
        return User.objects.filter(profile__role='STAFF')

    def perform_create(self, serializer):
        mla_constituency = self.request.user.profile.constituency
        user = serializer.save()
        user.profile.role = 'STAFF'
        if mla_constituency:
            user.profile.constituency = mla_constituency
        user.profile.save()


class DashboardMetricsView(APIView):
    permission_classes = [IsStaffOrMLA]

    def get(self, request, *args, **kwargs):
        user = request.user
        requests_qs = ConstituencyRequest.objects.all()
        
        if user.profile.constituency:
            requests_qs = requests_qs.filter(constituency__iexact=user.profile.constituency)
            
        assigned_only = request.query_params.get('assigned_only', None)
        if assigned_only == 'true' or user.profile.role == 'STAFF':
            if assigned_only == 'true':
                requests_qs = requests_qs.filter(assigned_staff=user)

        # 1. Total request counts by status
        status_counts = requests_qs.values('status').annotate(count=Count('id'))
        status_dict = {'PENDING': 0, 'IN_PROGRESS': 0, 'RESOLVED': 0, 'ESCALATED': 0}
        for item in status_counts:
            status_dict[item['status']] = item['count']
            
        # 2. Requests by Category
        category_counts = requests_qs.values('category').annotate(count=Count('id'))
        category_list = []
        category_labels = dict(ConstituencyRequest.CATEGORY_CHOICES)
        for item in category_counts:
            category_list.append({
                'category': item['category'],
                'label': category_labels.get(item['category'], item['category']),
                'count': item['count']
            })
            
        # 3. Requests by Urgency
        urgency_counts = requests_qs.values('urgency').annotate(count=Count('id'))
        urgency_dict = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
        for item in urgency_counts:
            urgency_dict[item['urgency']] = item['count']
            
        # 4. Requests by Place / Constituency broken down by Urgency
        constituency_counts = requests_qs.values('constituency').annotate(count=Count('id')).order_by('-count')[:10]
        constituency_list = []
        for item in constituency_counts:
            place_name = item['constituency'] or 'Unknown'
            place_qs = requests_qs.filter(constituency=item['constituency'])
            low_c = place_qs.filter(urgency='LOW').count()
            med_c = place_qs.filter(urgency='MEDIUM').count()
            high_c = place_qs.filter(urgency='HIGH').count()
            constituency_list.append({
                'name': place_name,
                'count': item['count'],
                'low': low_c,
                'medium': med_c,
                'high': high_c
            })

        # 5. Recent submissions
        recent_requests = requests_qs.order_by('-created_at')[:5]
        recent_serializer = ConstituencyRequestSerializer(recent_requests, many=True)
        
        # 6. Fraud & Duplicates Stats
        spam_count = requests_qs.filter(is_spam=True).count()
        duplicate_count = requests_qs.filter(is_duplicate=True).count()

        return Response({
            'total_requests': requests_qs.count(),
            'status_counts': status_dict,
            'category_counts': category_list,
            'urgency_counts': urgency_dict,
            'constituency_counts': constituency_list,
            'recent_requests': recent_serializer.data,
            'spam_count': spam_count,
            'duplicate_count': duplicate_count
        })
