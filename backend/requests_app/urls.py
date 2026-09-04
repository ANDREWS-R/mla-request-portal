from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    CitizenRegistrationView,
    CitizenRequestSubmitView,
    RequestViewSet,
    CommentViewSet,
    StaffManagementViewSet,
    DashboardMetricsView,
    BudgetViewSet,
    AppointmentSlotViewSet,
    AppointmentViewSet,
    PublicMetricsView
)

router = DefaultRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'staff', StaffManagementViewSet, basename='staff')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'appointment-slots', AppointmentSlotViewSet, basename='appointment-slot')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', CitizenRegistrationView.as_view(), name='citizen_register'),
    
    # Public citizen endpoint (direct post)
    path('submit-request/', CitizenRequestSubmitView.as_view(), name='submit_request'),
    
    # Public homepage statistics
    path('public-metrics/', PublicMetricsView.as_view(), name='public_metrics'),
    
    # Analytics / Dashboard metrics for staff
    path('metrics/', DashboardMetricsView.as_view(), name='dashboard_metrics'),
]
