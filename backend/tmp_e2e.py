import requests

base='http://127.0.0.1:8000/api/v1'
print('Registering user...')
reg={'username':'e2euser','email':'e2euser@example.com','full_name':'E2E User','password':'password123'}
r=requests.post(base+'/auth/register',json=reg)
print('register status',r.status_code,r.text)
print('Logging in...')
li={'email':'e2euser@example.com','password':'password123'}
r=requests.post(base+'/auth/login',json=li)
print('login status',r.status_code,r.text)
if r.status_code==200:
    # Support both token shapes (flat or nested under 'tokens')
    body=r.json()
    token = body.get('access_token') or (body.get('tokens') or {}).get('access_token')
    headers={'Authorization':f'Bearer {token}'}
    d=requests.get(base+'/dashboard',headers=headers)
    print('dashboard status',d.status_code,d.text)
else:
    print('Login failed; skipping dashboard')
