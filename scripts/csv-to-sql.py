#!/usr/bin/env python3
import csv
import sys

if len(sys.argv) < 2:
    sys.exit(0)

TABLE = sys.argv[1]
SKIP_COLS = {'password'}
reader = csv.DictReader(sys.stdin)
rows = list(reader)

if not rows:
    sys.exit(0)

all_cols = reader.fieldnames or []
insert_cols = [c for c in all_cols if c not in SKIP_COLS]

for row in rows:
    values = []
    for col in all_cols:
        if col in SKIP_COLS:
            continue
        val = row.get(col, '')
        if val == '':
            values.append('NULL')
        else:
            escaped = val.replace("'", "''")
            values.append(f"'{escaped}'")

    cols_str = ', '.join(insert_cols)
    vals_str = ', '.join(values)
    print(f"INSERT INTO {TABLE} ({cols_str}) VALUES ({vals_str});")
