from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from requests_app.models import UserProfile, ConstituencyRequest, RequestComment, ConstituencyBudget, AppointmentSlot, Appointment
import datetime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seed initial user roles, sample requests, budgets, and appointment slots.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        # 1. Create MLA User
        mla_user, created = User.objects.get_or_create(
            username='mla',
            email='mla@constituency.in',
            first_name='Anwar',
            last_name='Sadath'
        )
        if created or not mla_user.check_password('Password123'):
            mla_user.set_password('Password123')
            mla_user.save()
            self.stdout.write("Created/Updated MLA user 'mla' with password 'Password123'")
        
        # Ensure MLA role and constituency
        mla_profile = mla_user.profile
        mla_profile.role = 'MLA'
        mla_profile.constituency = 'Aluva'
        mla_profile.phone = '9876543210'
        mla_profile.save()

        # 2. Create Staff User
        staff_user, created = User.objects.get_or_create(
            username='staff',
            email='staff@constituency.in',
            first_name='Rahul',
            last_name='Nair'
        )
        if created or not staff_user.check_password('Password123'):
            staff_user.set_password('Password123')
            staff_user.save()
            self.stdout.write("Created/Updated Staff user 'staff' with password 'Password123'")

        # Ensure Staff role and constituency
        staff_profile = staff_user.profile
        staff_profile.role = 'STAFF'
        staff_profile.constituency = 'Aluva'
        staff_profile.phone = '9876543211'
        staff_profile.save()

        # 3. Create Citizen User
        citizen_user, created = User.objects.get_or_create(
            username='citizen',
            email='citizen@gmail.com',
            first_name='Vaishnav',
            last_name='Byju'
        )
        if created or not citizen_user.check_password('Password123'):
            citizen_user.set_password('Password123')
            citizen_user.save()
            self.stdout.write("Created/Updated Citizen user 'citizen' with password 'Password123'")

        # Ensure Citizen role
        citizen_profile = citizen_user.profile
        citizen_profile.role = 'CITIZEN'
        citizen_profile.constituency = 'Aluva'
        citizen_profile.phone = '9876543212'
        citizen_profile.save()

        # 4. Create constituency project budgets
        ConstituencyBudget.objects.all().delete()
        if True:
            self.stdout.write("Creating constituency budgets...")
            ConstituencyBudget.objects.create(
                project_name="Aluva Bypass Bridge Reconstruction",
                constituency="Aluva",
                category="ROADS",
                allocated_amount=8500000.00,
                spent_amount=7800000.00,
                resolution_time_days=25,
                description="Repair of the concrete bridge structure on the bypass road, including tarring and safety rails installation.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Ward 5 Drinking Water Pipe Network",
                constituency="Aluva",
                category="WATER",
                allocated_amount=6000000.00,
                spent_amount=5200000.00,
                resolution_time_days=18,
                description="Installing new PVC water supply pipes to provide clean water to 450 households.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Public Health Clinic Ward 12 Upgrade",
                constituency="Aluva",
                category="HEALTH",
                allocated_amount=7500000.00,
                spent_amount=4500000.00,
                resolution_time_days=30,
                description="Upgrading medical equipment, medicine stock room, and adding a sanitation ward in the clinic.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Smart Classroom Setup in Govt High School",
                constituency="Aluva",
                category="EDUCATION",
                allocated_amount=4000000.00,
                spent_amount=3800000.00,
                resolution_time_days=12,
                description="Providing interactive screens, computers, and internet access to 10 classrooms.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Solar Street Lights Installation Phase 1",
                constituency="Aluva",
                category="ELECTRICITY",
                allocated_amount=3500000.00,
                spent_amount=3200000.00,
                resolution_time_days=10,
                description="Installing 150 automated solar-powered LED street lamps along main roads.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Trivandrum Smart Road Tarring",
                constituency="Trivandrum",
                category="ROADS",
                allocated_amount=9500000.00,
                spent_amount=9200000.00,
                resolution_time_days=15,
                description="Smart road corridor development under City Corporation limits.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Kovalam Drainage Cleaning System",
                constituency="Trivandrum",
                category="WATER",
                allocated_amount=5000000.00,
                spent_amount=4800000.00,
                resolution_time_days=20,
                description="Upgrading wastewater sewage drains along tourist areas.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Ernakulam Metro Terminal Solar Panels",
                constituency="Ernakulam",
                category="ELECTRICITY",
                allocated_amount=12000000.00,
                spent_amount=11500000.00,
                resolution_time_days=22,
                description="Installing green solar grids across public transport hubs.",
                financial_year="2025-2026"
            )
            ConstituencyBudget.objects.create(
                project_name="Kozhikode Govt Hospital Medical Storage",
                constituency="Kozhikode",
                category="HEALTH",
                allocated_amount=8800000.00,
                spent_amount=8000000.00,
                resolution_time_days=28,
                description="Modern storage facility for sensitive vaccines and pharmaceutical stocks.",
                financial_year="2025-2026"
            )

        # 5. Create appointment slots
        if AppointmentSlot.objects.count() == 0:
            self.stdout.write("Creating available appointment slots...")
            today = datetime.date.today()
            
            # Create slots for the next 7 days (skipping Sunday)
            for d in range(1, 8):
                slot_date = today + datetime.timedelta(days=d)
                if slot_date.weekday() == 6: # Skip Sunday
                    continue
                
                # 3 Hourly Slots per day
                AppointmentSlot.objects.create(
                    date=slot_date,
                    start_time=datetime.time(10, 0),
                    end_time=datetime.time(11, 0),
                    max_appointments=4
                )
                AppointmentSlot.objects.create(
                    date=slot_date,
                    start_time=datetime.time(11, 0),
                    end_time=datetime.time(12, 0),
                    max_appointments=4
                )
                AppointmentSlot.objects.create(
                    date=slot_date,
                    start_time=datetime.time(14, 0),
                    end_time=datetime.time(15, 0),
                    max_appointments=4
                )

        # 6. Create sample requests if none exist
        if ConstituencyRequest.objects.count() == 0:
            self.stdout.write("No requests found, generating samples...")
            
            samples = [
                {
                    'submitter_name': 'K. R. Venugopal',
                    'submitter_email': 'venu@gmail.com',
                    'submitter_phone': '9446012345',
                    'subject': 'Water logging and open drain in Desom Road',
                    'description': 'Sir, due to heavy rains last night, the drainage has blocked. Water has flooded our shops near Desom Junction. Please take immediate action to clear the blockage.',
                    'translation': 'Sir, due to heavy rains last night, the drainage has blocked. Water has flooded our shops near Desom Junction. Please take immediate action to clear the blockage.',
                    'summary': 'Heavy rains caused drainage blockage and flooding in shops near Desom Junction.',
                    'source_language': 'en',
                    'constituency': 'Aluva',
                    'category': 'WATER',
                    'urgency': 'HIGH',
                    'status': 'PENDING',
                    'assigned_staff': None,
                    'submitted_by': citizen_user
                },
                {
                    'submitter_name': 'Mary Joseph',
                    'submitter_email': 'mary.j@yahoo.com',
                    'submitter_phone': '9895054321',
                    'subject': 'Potholes on Aluva-Munnar Road near Pump Junction',
                    'description': 'റോഡ് വളരെ മോശം അവസ്ഥയിലാണ്. വലിയ കുഴികൾ കാരണം സ്കൂൾ കുട്ടികളും ഇരുചക്ര വാഹന യാത്രക്കാരും നിരന്തരം അപകടത്തിൽ പെടുന്നു. ഇത് എത്രയും വേഗം തരിയിടണം.',
                    'translation': 'The road is in a very bad condition. Due to large potholes, school children and two-wheeler riders are constantly getting into accidents. This needs tarring as soon as possible.',
                    'summary': 'Road is in poor condition with large potholes near Pump Junction, causing frequent accidents.',
                    'source_language': 'ml',
                    'constituency': 'Aluva',
                    'category': 'ROADS',
                    'urgency': 'HIGH',
                    'status': 'IN_PROGRESS',
                    'assigned_staff': staff_user,
                    'submitted_by': None
                },
                {
                    'submitter_name': 'Suresh Kumar',
                    'submitter_email': 'suresh.k@gmail.com',
                    'submitter_phone': '9496055555',
                    'subject': 'Unstable electricity post near Aluva Library',
                    'description': 'An electric post near the public library has bent due to wind. It looks like it might fall anytime. Please arrange KSEB to replace it.',
                    'translation': 'An electric post near the public library has bent due to wind. It looks like it might fall anytime. Please arrange KSEB to replace it.',
                    'summary': 'A bent electric post near the library poses a hazard of falling down.',
                    'source_language': 'en',
                    'constituency': 'Aluva',
                    'category': 'ELECTRICITY',
                    'urgency': 'MEDIUM',
                    'status': 'RESOLVED',
                    'assigned_staff': staff_user,
                    'submitted_by': None
                },
                {
                    'submitter_name': 'Fathima Beevi',
                    'submitter_email': 'fathima.b@gmail.com',
                    'submitter_phone': '8547012345',
                    'subject': 'Application for Medical Grant / Financial Aid',
                    'description': 'Sir, my husband is undergoing heart surgery next week. The hospital estimate is 3 lakhs. We are in a very poor financial condition. Requesting some aid from MLA fund.',
                    'translation': 'Sir, my husband is undergoing heart surgery next week. The hospital estimate is 3 lakhs. We are in a very poor financial condition. Requesting some aid from MLA fund.',
                    'summary': 'Fathima requests financial aid of 3 lakhs for her husband\'s upcoming heart surgery.',
                    'source_language': 'en',
                    'constituency': 'Aluva',
                    'category': 'FINANCIAL_AID',
                    'urgency': 'MEDIUM',
                    'status': 'ESCALATED',
                    'assigned_staff': None,
                    'submitted_by': None
                },
                {
                    'submitter_name': 'John Doe (Spam)',
                    'submitter_email': 'spam@gmail.com',
                    'submitter_phone': '9999999999',
                    'subject': 'Buy Viagra now online cheap free casino',
                    'description': 'Click here to buy viagra cheap casino prize win money fast adult site crypto.',
                    'translation': 'Click here to buy viagra cheap casino prize win money fast adult site crypto.',
                    'summary': 'Spam advertisement links.',
                    'source_language': 'en',
                    'constituency': 'Aluva',
                    'category': 'OTHER',
                    'urgency': 'LOW',
                    'status': 'PENDING',
                    'assigned_staff': None,
                    'submitted_by': None,
                    'is_spam': True
                }
            ]

            for s in samples:
                req = ConstituencyRequest.objects.create(
                    submitter_name=s['submitter_name'],
                    submitter_email=s['submitter_email'],
                    submitter_phone=s['submitter_phone'],
                    subject=s['subject'],
                    description=s['description'],
                    translation=s['translation'],
                    summary=s['summary'],
                    source_language=s['source_language'],
                    constituency=s['constituency'],
                    category=s['category'],
                    urgency=s['urgency'],
                    status=s['status'],
                    assigned_staff=s['assigned_staff'],
                    submitted_by=s.get('submitted_by'),
                    is_spam=s.get('is_spam', False)
                )
                
                if req.status == 'IN_PROGRESS':
                    RequestComment.objects.create(
                        request=req,
                        user=staff_user,
                        text="I visited the site. We have submitted a request to the PWD engineer. They promised to fill the potholes by Friday."
                    )
                elif req.status == 'RESOLVED':
                    RequestComment.objects.create(
                        request=req,
                        user=staff_user,
                        text="KSEB workers came today and replaced the bent post with a new concrete post. The issue is resolved."
                    )

            self.stdout.write("Sample requests generated.")

        # Seed 1 active appointment for citizen
        if Appointment.objects.count() == 0 and AppointmentSlot.objects.exists():
            slot = AppointmentSlot.objects.first()
            Appointment.objects.create(
                slot=slot,
                citizen=citizen_user,
                citizen_name="Vaishnav Byju",
                citizen_phone="9876543212",
                topic="Request regarding financial grant for community hall repairs.",
                status="BOOKED"
            )
            self.stdout.write("Sample appointment booking generated.")
        
        self.stdout.write("Seeding completed successfully!")
