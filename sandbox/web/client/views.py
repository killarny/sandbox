from django.shortcuts import render


def chat(request):
    context = {
        'session_id': request.session.session_key,
    }
    return render(request, 'client/chat.html', context)
