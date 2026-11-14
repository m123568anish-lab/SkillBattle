import os
import glob

app_dir = r'frontend/src/app'
pages = glob.glob(os.path.join(app_dir, '**', 'page.tsx'), recursive=True)
pages.sort()

layout_usage = {}
for p in pages:
    rel_path = os.path.relpath(p, app_dir)
    route = '/' + os.path.dirname(rel_path).replace('\\', '/')
    if route == '/.': route = '/'
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    has_dashboard_layout = 'DashboardLayout' in content
    has_auth_layout = 'AuthLayout' in content
    layout_usage[route] = {
        'dashboard': has_dashboard_layout,
        'auth': has_auth_layout,
        'client': '"use client"' in content or "'use client'" in content,
        'path': rel_path
    }

print(f"Total pages: {len(pages)}")
for r, info in layout_usage.items():
    badge = 'DASHBOARD' if info['dashboard'] else ('AUTH' if info['auth'] else 'STANDALONE')
    client = 'CLIENT' if info['client'] else 'SERVER'
    print(f"{r:40} | {badge:12} | {client:7}")
