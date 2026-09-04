from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, ConstituencyRequest, RequestComment, ConstituencyBudget, AppointmentSlot, Appointment
from .ai_services import transcribe_voice, translate_text, summarize_and_classify, check_spam_or_fraud, find_duplicate_requests
import os

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'constituency', 'phone']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
            
        # Update profile role/fields
        profile = user.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance


class CitizenRegisterSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'phone']

    def validate(self, attrs):
        email = attrs.get('email', '')
        phone = attrs.get('phone', '')
        if not email and not phone:
            raise serializers.ValidationError("At least one contact method (Email or Phone number) is required.")
        return attrs

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')
        
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(password)
        user.save()
        
        # Set profile role to CITIZEN
        profile = user.profile
        profile.role = 'CITIZEN'
        profile.phone = phone
        profile.constituency = 'Aluva'  # Default constituency for simulation
        profile.save()
        
        return user


class ConstituencyBudgetSerializer(serializers.ModelSerializer):
    category_label = serializers.SerializerMethodField()

    class Meta:
        model = ConstituencyBudget
        fields = ['id', 'project_name', 'constituency', 'category', 'category_label', 'allocated_amount', 'spent_amount', 'resolution_time_days', 'description', 'financial_year']

    def get_category_label(self, obj):
        return obj.get_category_display()


class AppointmentSlotSerializer(serializers.ModelSerializer):
    bookings_count = serializers.IntegerField(source='bookings.count', read_only=True)
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ['id', 'date', 'start_time', 'end_time', 'max_appointments', 'is_cancelled', 'bookings_count', 'is_available']

    def get_is_available(self, obj):
        if obj.is_cancelled:
            return False
        # Filter active bookings (exclude cancelled)
        active_bookings = obj.bookings.filter(status='BOOKED').count()
        return active_bookings < obj.max_appointments


class AppointmentSerializer(serializers.ModelSerializer):
    slot_details = serializers.SerializerMethodField()
    citizen_name_display = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'slot', 'slot_details', 'citizen', 'citizen_name', 'citizen_name_display', 'citizen_phone', 'topic', 'status', 'notes', 'created_at']
        read_only_fields = ['citizen', 'created_at']

    def get_slot_details(self, obj):
        return {
            'date': obj.slot.date,
            'start_time': obj.slot.start_time,
            'end_time': obj.slot.end_time
        }

    def get_citizen_name_display(self, obj):
        if obj.citizen:
            return f"{obj.citizen.first_name} {obj.citizen.last_name}".strip() or obj.citizen.username
        return obj.citizen_name


class RequestCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_role = serializers.ReadOnlyField(source='user.profile.role')

    class Meta:
        model = RequestComment
        fields = ['id', 'request', 'user', 'user_name', 'user_role', 'text', 'created_at']
        read_only_fields = ['user']


class ConstituencyRequestSerializer(serializers.ModelSerializer):
    comments = RequestCommentSerializer(many=True, read_only=True)
    assigned_staff_name = serializers.SerializerMethodField()
    original_voice_filename = serializers.SerializerMethodField()
    submitter_display_name = serializers.SerializerMethodField()

    class Meta:
        model = ConstituencyRequest
        fields = [
            'id', 'submitted_by', 'submitter_display_name',
            'submitter_name', 'submitter_email', 'submitter_phone',
            'subject', 'description', 'translation', 'summary', 'source_language',
            'constituency', 'category', 'custom_category', 'urgency', 'is_spam', 'is_duplicate', 'duplicate_of',
            'status', 'assigned_staff', 'assigned_staff_name',
            'voice_file', 'original_voice_filename', 'attachment_file',
            'created_at', 'updated_at', 'comments'
        ]
        read_only_fields = [
            'translation', 'summary', 'source_language',
            'urgency',
            'is_spam', 'is_duplicate', 'duplicate_of',
            'created_at', 'updated_at'
        ]

    def get_assigned_staff_name(self, obj):
        if obj.assigned_staff:
            return f"{obj.assigned_staff.first_name} {obj.assigned_staff.last_name}".strip() or obj.assigned_staff.username
        return None

    def get_original_voice_filename(self, obj):
        if obj.voice_file:
            return os.path.basename(obj.voice_file.name)
        return None

    def get_submitter_display_name(self, obj):
        if obj.submitted_by:
            return f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}".strip() or obj.submitted_by.username
        return obj.submitter_name or "Anonymous"

    def create(self, validated_data):
        request_obj = ConstituencyRequest(**validated_data)
        request_obj.save()
        
        # 1. Voice transcription if voice_file is uploaded
        if request_obj.voice_file:
            try:
                transcription = transcribe_voice(request_obj.voice_file.path)
                if transcription:
                    if not request_obj.description:
                        request_obj.description = transcription
                    else:
                        request_obj.description += f"\n\n[Transcribed Voice]: {transcription}"
            except Exception as e:
                print(f"Error during audio transcription: {e}")
                if not request_obj.description:
                    request_obj.description = "Audio file uploaded but transcription failed."

        if not request_obj.description:
            request_obj.description = f"Request regarding: {request_obj.subject}"

        # 2. Check Spam/Fraud Heuristics
        try:
            request_obj.is_spam = check_spam_or_fraud(request_obj.description)
        except Exception as e:
            print(f"Error checking spam: {e}")
            request_obj.is_spam = False

        # 3. Translation
        try:
            translation, src_lang = translate_text(request_obj.description)
            request_obj.translation = translation
            request_obj.source_language = src_lang
        except Exception as e:
            print(f"Error during translation: {e}")
            request_obj.translation = request_obj.description
            request_obj.source_language = "en"

        # 4. Summarization and Classification
        try:
            analysis = summarize_and_classify(request_obj.translation or request_obj.description)
            request_obj.summary = analysis.get('summary', '')
            request_obj.urgency = analysis.get('urgency', 'MEDIUM')
            if not validated_data.get('category'):
                request_obj.category = analysis.get('category', 'OTHER')
            
            if not request_obj.constituency or request_obj.constituency == 'Unknown':
                request_obj.constituency = analysis.get('constituency', 'Unknown')
        except Exception as e:
            print(f"Error during summarization/classification: {e}")
            request_obj.summary = request_obj.description[:150]
            request_obj.urgency = 'MEDIUM'
            if not validated_data.get('category'):
                request_obj.category = 'OTHER'
            if not request_obj.constituency:
                request_obj.constituency = 'Unknown'

        # 5. Check Duplicate Request Heuristics
        try:
            is_dup, original_id = find_duplicate_requests(
                request_obj.translation or request_obj.description, 
                request_obj.constituency or 'Aluva', 
                exclude_id=request_obj.id
            )
            if is_dup:
                request_obj.is_duplicate = True
                request_obj.duplicate_of_id = original_id
                
                # Check if it is from the same person
                orig = ConstituencyRequest.objects.get(id=original_id)
                same_submitter = False
                if request_obj.submitted_by and request_obj.submitted_by == orig.submitted_by:
                    same_submitter = True
                if request_obj.submitter_phone and request_obj.submitter_phone == orig.submitter_phone:
                    same_submitter = True
                if request_obj.submitter_email and request_obj.submitter_email == orig.submitter_email:
                    same_submitter = True
                
                if same_submitter:
                    # Automatically remove the additional duplicate request from the database
                    print(f"Deleting additional duplicate request {request_obj.id} from the same submitter.")
                    if request_obj.id:
                        request_obj.delete()
                    raise serializers.ValidationError("This duplicate request has been automatically removed as you have already submitted it.")
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"Error checking duplicate: {e}")
            request_obj.is_duplicate = False

        request_obj.save()
        return request_obj
