file_path = 'public/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify content before deleting (safety check)
# Line 1578 (index 1577) should start with <svg
# Line 1678 (index 1677) shoud be close to </div> or empty

print(f"Line 1579 content: {lines[1578]}") 
print(f"Line 1679 content: {lines[1678]}")

# ADJUST INDICES BASED ON VISUAL INSPECTION
start_line = 1578 # 1-based
end_line = 1678   # 1-based

# Python slicing is 0-based
# We want to keep 0..(start_line-2)  -> lines 1 to 1577
# Skip (start_line-1)..(end_line-1) -> lines 1578 to 1678
# Resume at end_line -> line 1679

new_content = lines[:start_line-1] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print(f"Deleted lines {start_line} to {end_line}")
