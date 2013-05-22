import os.path
import sys
from django.core.management.color import color_style
import sandbox
import sandbox.web

try:
    from sandbox.web.web.settings_local import SECRET_KEY
    from sandbox.web.web.settings_local import GOOGLE_OAUTH2_CLIENT_ID
    from sandbox.web.web.settings_local import GOOGLE_OAUTH2_CLIENT_SECRET
    from sandbox.web.web.settings_local import INTERNAL_IPS
except ImportError as e:
    print color_style().ERROR('Error in settings_local.py: {error}'.format(
        error=str(e)
    ))
    sys.exit(1)

REPOSITORY_ROOT = sandbox.__path__[0]
WEB_ROOT = sandbox.web.__path__[0]
MEDIA_ROOT = os.path.join(WEB_ROOT, 'media_root')
STATIC_ROOT = os.path.join(MEDIA_ROOT, 'static')

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGIN_ERROR_URL = '/login-error/'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', 
        'NAME': os.path.join(WEB_ROOT, 'sqlite.db'),
    }
}
INSTALLED_APPS = (
    'grappelli',
    'django.contrib.auth', 
    'social_auth',
    'django.contrib.contenttypes', 
    'django.contrib.sessions', 
    'django.contrib.sites', 
    'django.contrib.messages', 
    'django.contrib.staticfiles', 
    'django.contrib.admin', 
    'django.contrib.admindocs', 
    'debug_toolbar',
    'sandbox.web.api',
    'sandbox.web.client',
)
TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
)
MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
)

GRAPPELLI_ADMIN_TITLE = "Sandbox"

DEBUG = True
TEMPLATE_DEBUG = True
USE_L10N = True
USE_TZ = True
ROOT_URLCONF = 'sandbox.web.web.urls'
SETTINGS_MODULE = 'sandbox.web.web.settings'
WSGI_APPLICATION = 'sandbox.web.web.wsgi.application'
SITE_ID = 1

AUTHENTICATION_BACKENDS = (
    'social_auth.backends.google.GoogleOAuth2Backend',
    'django.contrib.auth.backends.ModelBackend',
)
SOCIAL_AUTH_USERNAME_IS_FULL_EMAIL = True

LOGGING = {
    'loggers': {
        'django.request': {
            'level': 'ERROR', 
            'propagate': True, 
            'handlers': ['mail_admins']
        }
    }, 
    'version': 1, 
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    }, 
    'disable_existing_loggers': False, 
    'handlers': {
        'mail_admins': {
            'class': 'django.utils.log.AdminEmailHandler', 
            'filters': ['require_debug_false'], 
            'level': 'ERROR'
        }
    }
}

