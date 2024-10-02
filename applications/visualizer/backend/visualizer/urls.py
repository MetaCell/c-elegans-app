"""
URL configuration for celegans project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static

from api.api import api
from .views import index, access_bucket_artifact, get_tile

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    *static(settings.STATIC_URL, document_root=settings.STATIC_ROOT),
    re_path(
        r"resources/(?P<dataset>\w+)/em/(?P<slice>\d+)/(?P<x>\d+)_(?P<y>\d+)_(?P<zoom>\d+).jpg",
        get_tile,
        name="em_resources",
    ),
    re_path(r"resources/(?P<path>.+)", access_bucket_artifact, name="resources"),
    re_path(r"(?P<path>.*)", index, name="index"),
]
