import re
import os

def fix_file(file_path):
    print(f"Fixing {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix common tags with spaces
    tags = ['div', 'span', 'button', 'input', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'svg', 'table', 'tr', 'td', 'option', 'label', 'a', 'i', 'img', 'select', 'ul', 'li', 'polyline', 'path', 'circle', 'line', 'rect', 'tbody', 'thead', 'nav', 'main', 'header', 'footer', 'section', 'article', 'aside', 'canvas', 'script', 'style', 'html', 'head', 'body', 'meta', 'link', 'title']

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

public_dir = r'c:\Proyectos\notary-crm-web\public'
for root, dirs, files in os.walk(public_dir):
    for file in files:
        if file.endswith(('.js', '.html', '.json', '.css')):
            fix_file(os.path.join(root, file))

print("Global fix applied")
