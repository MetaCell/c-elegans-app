from ninja.security import HttpBasicAuth
from django.contrib.auth import authenticate as django_authenticate


class BasicAuthSuperUser(HttpBasicAuth):
    def authenticate(self, request, username, password):
        # Authenticate user with Django's built-in authenticate function
        user = django_authenticate(request, username=username, password=password)
        if user and user.is_superuser:  # Ensure the user is a superuser
            return user
        return None
    
basic_auth_superuser = BasicAuthSuperUser()