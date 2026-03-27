import re

with open('ai_debug.log', 'r') as f:
    content = f.read()

matches = re.findall(r"Hex diff: k=(.*?), sid=(.*)", content)
if not matches:
    print("No Hex diff matches found.")
    # Try looking for Received/Available logs
    rx_match = re.search(r"DEBUG: Received series_id: '(.*)' \(len=(\d+)\)", content)
    if rx_match:
        print(f"Received: {rx_match.group(1)} (len {rx_match.group(2)})")
else:
    k_hex, s_hex = matches[-1]
    k_str = bytes.fromhex(k_hex).decode()
    s_str = bytes.fromhex(s_hex).decode()
    print(f"K (disk): {k_str.encode().hex()}")
    print(f"S (req):  {s_str.encode().hex()}")
    
    if k_str == s_str:
        print("Strings are EQUAL.")
    else:
        print("Strings are NOT EQUAL.")
        # Find where it breaks
        for i in range(max(len(k_str), len(s_str))):
            ck = k_str[i] if i < len(k_str) else 'EOF'
            cs = s_str[i] if i < len(s_str) else 'EOF'
            if ck != cs:
                print(f"Diff at {i}: K={repr(ck)} ({ord(ck) if len(ck)==1 else -1}), S={repr(cs)} ({ord(cs) if len(cs)==1 else -1})")
                break
