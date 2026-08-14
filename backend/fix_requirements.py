#!/usr/bin/env python3
import os

# Read UTF-16 file
with open('requirements.txt', 'r', encoding='utf-16') as f:
    lines = f.readlines()

# Add test dependencies if not already present
test_deps = [
    'pytest==7.4.3',
    'pytest-asyncio==0.21.1',
    'pytest-cov==4.1.0',
    'coverage==7.15.0',
    'factory_boy==3.3.3',
    'Faker==40.28.1'
]

# Check what's already there
existing = {line.strip() for line in lines}
new_lines = [line.rstrip('\n') for line in lines]

for dep in test_deps:
    pkg_name = dep.split('==')[0].lower()
    found = any(pkg_name in line.lower() for line in new_lines)
    if not found:
        new_lines.append(dep)

# Write back with newlines
with open('requirements.txt', 'w', encoding='utf-8') as f:
    for line in new_lines:
        f.write(line + '\n')

print("✅ Added test dependencies to requirements.txt")
