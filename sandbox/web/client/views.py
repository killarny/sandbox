from django.contrib.auth.decorators import login_required
from django.shortcuts import render


def login(request):
    return render(request, 'client/login.html')

@login_required
def chat(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/chat.html', context)
