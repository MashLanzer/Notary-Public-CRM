import re
import os

def fix_content(content):
    # Fix spaces around hyphens where it's likely a class name or attribute
    # .tab - btn -> .tab-btn
    # data - tab -> data-tab
    # id - expiry -> id-expiry
    
    # First, fix common classes and attributes I've seen broken
    # Pattern: space hyphen space
    content = content.replace(' - ', '-')
    
    # Fix cases where only one space was introduced
    content = content.replace(' -t', '-t') # -tab, -title, -text
    content = content.replace('t- ', 't-')
    content = content.replace(' -b', '-b') # -btn
    content = content.replace('n- ', 'n-')
    content = content.replace(' -c', '-c') # -container, -content, -card
    content = content.replace('d- ', 'd-')
    content = content.replace(' -r', '-r') # -recent, -row
    content = content.replace('w- ', 'w-')
    content = content.replace(' -h', '-h') # -header, -home
    content = content.replace(' -f', '-f') # -footer, -form
    content = content.replace(' -v', '-v') # -view
    content = content.replace(' -l', '-l') # -list
    content = content.replace(' -p', '-p') # -profile, -primary
    content = content.replace(' -g', '-g') # -grid, -group
    content = content.replace(' -i', '-i') # -info, -icon
    content = content.replace(' -s', '-s') # -status, -sm
    
    # Fix tags as well just in case they came back
    content = re.sub(r'< ([a-z][a-z0-9]*)', r'<\1', content)
    content = re.sub(r'<\/ ([a-z][a-z0-9]*)', r'</\1', content)
    content = re.sub(r'([a-zA-Z0-9\"\'\)]) >', r'\1>', content)
    
    # Fix specific corrupted lines I saw in logs
    content = content.replace('tab - btn', 'tab-btn')
    content = content.replace('data - tab', 'data-tab')
    content = content.replace('user - profile - badge', 'user-profile-badge')
    content = content.replace('user - role - tag', 'user-role-tag')
    content = content.replace('user - info - mini', 'user-info-mini')
    content = content.replace('user - email', 'user-email')
    
    return content

file_path = r'c:\Proyectos\notary-crm-web\public\app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = fix_content(content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Repair applied to app.js")
