from django.conf.urls import patterns, include, url


urlpatterns = patterns('sandbox.web.client.views',
    url(r'^$', 'chat', name='chat'),
)
