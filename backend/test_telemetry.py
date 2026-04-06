import fastf1
import sys

print("Testing telemetry_pipeline...")

from telemetry_pipeline import get_telemetry_comparison

# Test 1: Known working pair
try:
    res = get_telemetry_comparison(2024, 'Bahrain', 'VER', 'LEC', 'Q')
    print("Bahrain OK. Delta:", res['delta_vs_a'])
except Exception as e:
    print("Bahrain FAILED:", e)

# Test 2: Canada
try:
    res = get_telemetry_comparison(2024, 'Canada', 'VER', 'LEC', 'Q')
    print("Canada OK. Delta:", res['delta_vs_a'])
except Exception as e:
    print("Canada FAILED:", e)

# Test 3: Monaco
try:
    res = get_telemetry_comparison(2024, 'Monaco', 'VER', 'LEC', 'Q')
    print("Monaco OK. Delta:", res['delta_vs_a'])
except Exception as e:
    print("Monaco FAILED:", e)
