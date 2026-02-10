# Supabase Self-Hosted Docker Setup

## Quick Start

### 1. Copy environment file

```bash
cp docker/.env.example .env
```

### 2. Generate secrets

Generate secure secrets for production:

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Postgres password
openssl rand -base64 24

# Realtime secret key base (64 characters)
openssl rand -base64 64
```

### 3. Generate API keys

Go to https://supabase.com/docs/guides/self-hosting#api-keys and generate:
- `ANON_KEY` - for anonymous access
- `SERVICE_ROLE_KEY` - for admin access (keep secret!)

Or use the JWT generator with your `JWT_SECRET`:
```bash
# Online tool: https://jwt.io/
# Payload for ANON_KEY:
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}

# Payload for SERVICE_ROLE_KEY:
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}
```

### 4. Update .env file

Edit `.env` with your generated secrets:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`

### 5. Start services

```bash
docker-compose up -d
```

### 6. Access services

- **Studio Dashboard**: http://localhost:3001
- **API Endpoint**: http://localhost:8000
- **Database**: localhost:5432

## Services

| Service | Port | Description |
|---------|------|-------------|
| Studio | 3001 | Admin dashboard |
| Kong | 8000 | API gateway |
| PostgreSQL | 5432 | Database |
| GoTrue | 9999 (internal) | Authentication |
| PostgREST | 3000 (internal) | REST API |
| Realtime | 4000 (internal) | WebSocket subscriptions |
| Storage | 5000 (internal) | File storage |

## Directory Structure

```
docker/
├── .env.example          # Environment template
├── kong/
│   └── kong.yml          # Kong API gateway config
└── volumes/
    ├── db/
    │   ├── data/         # PostgreSQL data
    │   ├── roles.sql     # Database roles init
    │   ├── jwt.sql       # JWT functions
    │   ├── realtime.sql  # Realtime setup
    │   └── webhooks.sql  # Webhooks setup
    ├── storage/          # File storage
    ├── functions/        # Edge functions
    │   └── main/         # Main function entry
    └── logs/             # Service logs
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f db
docker-compose logs -f auth

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v

# Access PostgreSQL
docker exec -it supabase-db psql -U postgres
```

## Troubleshooting

### Database not starting
Check if port 5432 is already in use:
```bash
netstat -an | findstr 5432
```

### Auth not working
1. Verify JWT_SECRET is the same across all services
2. Check ANON_KEY and SERVICE_ROLE_KEY are valid JWTs
3. Verify API_EXTERNAL_URL matches your setup

### Studio not loading
1. Check if all dependent services are healthy
2. Verify SUPABASE_URL and keys in Studio environment

## Security Notes

1. **Never commit `.env` file** - it contains secrets
2. **Change default passwords** before production
3. **Use HTTPS** in production (configure Kong SSL)
4. **Restrict database access** - don't expose port 5432 publicly
