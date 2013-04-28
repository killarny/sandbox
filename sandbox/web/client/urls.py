from django.conf.urls import patterns, include, url


urlpatterns = patterns('sandbox.web.client.views',
    url(r'^$', 'chat', name='chat'),
    url(r'^login/$', 'login', name='login'),
    url(r'^login-error/$', 'login_error', name='login-error'),
)
