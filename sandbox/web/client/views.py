from django.shortcuts import render


def login(request):
    return render(request, 'client/login.html')

def chat(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/chat.html', context)
