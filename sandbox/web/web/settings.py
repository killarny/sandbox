import os.path
import sandbox
import sandbox.web

REPOSITORY_ROOT = sandbox.__path__[0]
WEB_ROOT = sandbox.web.__path__[0]
MEDIA_ROOT = os.path.join(WEB_ROOT, 'media_root')
STATIC_ROOT = os.path.join(MEDIA_ROOT, 'static')

STATIC_URL = '/static/'
MEDIA_URL = '/media/'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', 
        'NAME': os.path.join(WEB_ROOT, 'sqlite.db'),
    }
}
INSTALLED_APPS = (
    'grappelli',
    'django.contrib.auth', 
    'django.contrib.contenttypes', 
    'django.contrib.sessions', 
    'django.contrib.sites', 
    'django.contrib.messages', 
    'django.contrib.staticfiles', 
    'django.contrib.admin', 
    'django.contrib.admindocs', 
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

GRAPPELLI_ADMIN_TITLE = "Sandbox"

DEBUG = True
TEMPLATE_DEBUG = True
USE_L10N = True
USE_TZ = True
ROOT_URLCONF = 'sandbox.web.web.urls'
SETTINGS_MODULE = 'sandbox.web.web.settings'
WSGI_APPLICATION = 'sandbox.web.web.wsgi.application'
SITE_ID = 1

SECRET_KEY = 'jki(26r@5%za%i-r-)pblu-sah--$r70s(0vvp3+k7&p_8b_bl'
import warnings
warnings.warn('Change the secret key before deploying!')

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

