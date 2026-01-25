import os

file_path = 'public/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_marker = '<div class="modal" id="help-center-modal">'
end_marker = "<!-- Scripts -->"

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker in line:
        start_idx = i
    if end_marker in line:
        end_idx = i

if start_idx == -1 or end_idx == -1:
    print("Markers not found")
    exit(1)

# Find where the new modal ends (after </style>)
style_end_idx = -1
for i in range(start_idx, len(lines)):
    if "</style>" in lines[i]:
        style_end_idx = i
        break

if style_end_idx == -1:
    print("Style end not found")
    exit(1)

# The modal closes with two </div> after style
modal_end_idx = style_end_idx + 2

print(f"Keeping lines 0 to {modal_end_idx}")
print(f"Resuming at line {end_idx}")
print(f"Deleting {end_idx - modal_end_idx - 1} lines of garbage")

new_content = lines[:modal_end_idx+1] + lines[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Done")
