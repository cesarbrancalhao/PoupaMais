#!/usr/bin/env bash
set -eo pipefail

if [ -z "$1" ]; then
    echo "Usage: make dump <email>"
    echo "Example: make dump useremail554@gmail.com"
    exit 1
fi

EMAIL="$1"
RUNTIME="${RUNTIME:-podman}"
DOCKER="$RUNTIME"
CONTAINER="poupa_mais_db"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DUMP_DIR="$PROJECT_DIR/dump"

SANITIZED=$(echo "$EMAIL" | sed 's/@/-at-/g; s/\./-dot-/g')
OUTPUT="$DUMP_DIR/${SANITIZED}.sql"

mkdir -p "$DUMP_DIR"

USER_ID=$($DOCKER exec "$CONTAINER" psql -U postgres -d poupa_mais -t -A -c \
    "SELECT id FROM users WHERE email = '${EMAIL}';" 2>/dev/null | tr -d '[:space:]')

if [ -z "$USER_ID" ]; then
    echo "Error: user with email '${EMAIL}' not found in the database."
    exit 1
fi

echo "Dumping data for ${EMAIL} (ID: ${USER_ID})..."

{
    echo "-- ======================================================="
    echo "-- PoupaMais User Data Dump"
    echo "-- User: ${EMAIL} (ID: ${USER_ID})"
    echo "-- Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "-- Tables are ordered by dependency for clean re-import."
    echo "-- Passwords were excluded. Recreate them after import."
    echo "-- ======================================================="
    echo ""

    TABLES=(
        "id:users"
        "email:verification"
        "user_id:password_reset"
        "user_id:expense_category"
        "user_id:income_source"
        "user_id:expense"
        "user_id:income"
        "user_id:expense_exclusion"
        "user_id:income_exclusion"
        "user_id:goal"
        "user_id:goal_contribution"
    )

    for entry in "${TABLES[@]}"; do
        KEY_TYPE="${entry%%:*}"
        TABLE="${entry##*:}"

        if [ "$KEY_TYPE" = "id" ]; then
            WHERE="WHERE id = ${USER_ID}"
        elif [ "$KEY_TYPE" = "email" ]; then
            WHERE="WHERE email = '${EMAIL}'"
        else
            WHERE="WHERE user_id = ${USER_ID}"
        fi

        echo "-- Table: ${TABLE}"

        $DOCKER exec "$CONTAINER" psql -U postgres -d poupa_mais -t -A -c \
            "COPY (SELECT * FROM ${TABLE} ${WHERE}) TO STDOUT WITH CSV HEADER;" 2>/dev/null | \
            python3 "$SCRIPT_DIR/csv-to-sql.py" "$TABLE" 2>/dev/null

        echo ""
    done

    echo "-- End of dump"
} > "$OUTPUT"

echo "Done. Dump saved to ${OUTPUT}"
