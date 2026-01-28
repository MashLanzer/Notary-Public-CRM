import re

file_path = r'c:\Proyectos\notary-crm-web\public\app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix common tags with spaces
tags = ['div', 'span', 'button', 'input', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'svg', 'table', 'tr', 'td', 'option', 'label', 'a', 'i', 'img', 'select', 'ul', 'li', 'polyline', 'path', 'circle', 'line', 'rect', 'tbody', 'thead']

for tag in tags:
    # Fix opening tag < tag
    content = re.sub(rf'< {tag}', f'<{tag}', content)
    # Fix closing tag </ tag
    content = re.sub(rf'<\/ {tag}', f'</{tag}', content)
    # Fix ending of tags tag >
    content = re.sub(rf'{tag} >', f'{tag}>', content)

# Fix generic space before closing bracket if it's likely a tag ending
# e.g. class="foo" >
content = re.sub(r'([\"\'a-zA-Z0-9]) >', r'\1>', content)

# Fix generic space after opening bracket of closing tag
# e.g. </ div
content = re.sub(r'<\/ ', r'</', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied to app.js")
