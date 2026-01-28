import re
import os

def fix_content(content):
    # Fix spaces around hyphens where it's likely a class name or attribute
    content = content.replace(' - ', '-')
    content = content.replace(' -t', '-t')
    content = content.replace('t- ', 't-')
    content = content.replace(' -b', '-b')
    content = content.replace('n- ', 'n-')
    content = content.replace(' -c', '-c')
    content = content.replace('d- ', 'd-')
    content = content.replace(' -r', '-r')
    content = content.replace('w- ', 'w-')
    content = content.replace(' -h', '-h')
    content = content.replace(' -f', '-f')
    content = content.replace(' -v', '-v')
    content = content.replace(' -l', '-l')
    content = content.replace(' -p', '-p')
    content = content.replace(' -g', '-g')
    content = content.replace(' -i', '-i')
    content = content.replace(' -s', '-s')
    
    # Fix tags
    content = re.sub(r'< ([a-z][a-z0-9]*)', r'<\1', content)
    content = re.sub(r'<\/ ([a-z][a-z0-9]*)', r'</\1', content)
    # Be more conservative with > to avoid breaking math
    # But common patterns like " > or px; > or ) > or t" >
    content = re.sub(r'([\"\'a-zA-Z0-9\)]) >', r'\1>', content)
    
    # Fix the specific icon reference while we are at it
    content = content.replace('href="icon-192.png"', 'href="image/icon-192.png"')
    content = content.replace('href="icon-512.png"', 'href="image/icon-512.png"')
    
    return content

paths = [
    r'c:\Proyectos\notary-crm-web\public\index.html',
    r'c:\Proyectos\notary-crm-web\public\landing.html',
    r'c:\Proyectos\notary-crm-web\public\booking.html',
    r'c:\Proyectos\notary-crm-web\public\status.html',
    r'c:\Proyectos\notary-crm-web\public\app.js'
]

for p in paths:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = fix_content(content)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Repaired: {p}")
