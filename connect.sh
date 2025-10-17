#!/bin/bash
# filepath: /home/gem/projects/Rhomes/rhomes/connect.sh

# Load environment variables from .env
set -a
source ./services/database/.env
set +a

# Build the connection string (without authentication for initial admin creation)
CONN_STR="mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl=${DB_SSL}"

# Create admin user using mongosh
