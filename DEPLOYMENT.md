# Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Node.js**: Version 18 or higher

## Step 1: Set Up Supabase

### 1.1 Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - Name: `restaurant-pos-production`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created

### 1.2 Run Database Migrations

1. Copy the SQL from `database-schema.sql`
2. Go to SQL Editor in Supabase Dashboard
3. Paste and run the SQL to create all tables and policies

### 1.3 Run Database Functions

1. Copy the SQL from `database-functions.sql`
2. Go to SQL Editor in Supabase Dashboard
3. Paste and run the SQL to create auto-numbering functions

### 1.4 Get API Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Step 2: Deploy to Vercel

### 2.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 2.2 Configure Environment Variables

Add the following environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Visit your production URL

## Step 3: Initial Setup

### 3.1 Create First Tenant

1. Visit your deployed app URL
2. Go to `/setup` route
3. Fill in:
   - Business Name
   - Admin Email
   - Admin Password
   - Admin Full Name
4. Click "Create Account"

### 3.2 Verify Setup

1. Login with admin credentials
2. Verify all features are working:
   - Dashboard loads
   - Can create products
   - Can access POS
   - Can create transactions

## Step 4: Production Checklist

- [ ] Database migrations completed
- [ ] Database functions created
- [ ] Environment variables configured
- [ ] First tenant created
- [ ] Admin user can login
- [ ] All pages load correctly
- [ ] PWA installation works on mobile
- [ ] Test a complete sale transaction
- [ ] Test inventory management
- [ ] Test user creation (if admin)

## Troubleshooting

### Issue: "Invalid API Key"
- Verify environment variables are correct
- Check Supabase project is active
- Ensure anon key is copied correctly

### Issue: "Database Error"
- Verify all migrations ran successfully
- Check RLS policies are enabled
- Ensure database functions exist

### Issue: "Cannot Create Tenant"
- Check database schema is correct
- Verify triggers are working
- Check Supabase logs for errors

### Issue: PWA Not Installing
- Ensure HTTPS is enabled (Vercel provides this)
- Check manifest.json is accessible
- Verify service worker is registered

## Monitoring

### Supabase Dashboard
- Monitor database usage
- Check API requests
- Review logs for errors

### Vercel Dashboard
- Monitor deployment status
- Check function logs
- Review analytics

## Backup Strategy

### Database Backups
1. Go to Supabase Dashboard > Database > Backups
2. Enable automatic daily backups
3. Test restore process periodically

### Manual Backup
```sql
-- Export all data
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

## Scaling Considerations

### Database
- Monitor connection pool usage
- Add indexes for frequently queried columns
- Consider read replicas for high traffic

### Application
- Vercel automatically scales
- Monitor function execution times
- Optimize slow queries

## Security Best Practices

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update Supabase regularly

2. **Access Control**
   - Review RLS policies regularly
   - Audit user permissions
   - Monitor failed login attempts

3. **Data Protection**
   - Enable database backups
   - Use strong passwords
   - Implement rate limiting if needed

## Support

For issues or questions:
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Review application logs in Vercel dashboard
