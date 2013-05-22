from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import redirect, render


def login(request):
    return render(request, 'client/login.html')

def login_error(request):
    messages.error(request, 'We could not log you in. Please try again later.')
    return redirect('login')

@login_required
def chat(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/chat.html', context)

@login_required
def demo(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/demo.html', context)

def physics(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/physics.html', context)
