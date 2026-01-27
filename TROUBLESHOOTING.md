# Troubleshooting Guide - AI Orchestrator

Comprehensive troubleshooting guide for common issues and their solutions.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Build & Development Issues](#build--development-issues)
4. [Runtime Issues](#runtime-issues)
5. [API Issues](#api-issues)
6. [WebSocket Issues](#websocket-issues)
7. [Authentication Issues](#authentication-issues)
8. [Performance Issues](#performance-issues)
9. [Deployment Issues](#deployment-issues)
10. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check Commands

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version

# Check if dependencies are installed
ls node_modules

# Check if build exists
ls dist

# Check if application is running
curl http://localhost:3001/health

# Check WebSocket connection
wscat -c ws://localhost:3001/ws/transcription
```

### Common Quick Fixes

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json dist
   npm install
   npm run build
   ```

2. **Reset environment:**
   ```bash
   unset PORT NODE_ENV FRONTEND_URL JWT_SECRET
   # Then set again
   ```

3. **Restart application:**
   ```bash
   # If using PM2
   pm2 restart ai-orchestrator
   
   # If using npm
   npm run start:prod
   ```

## Installation Issues

### Issue: `npm install` fails

**Symptoms:**
- Error messages during installation
- Missing dependencies
- Permission errors

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Use different package manager:**
   ```bash
   # Try yarn
   yarn install
   
   # Or pnpm
   pnpm install
   ```

4. **Check disk space:**
   ```bash
   df -h
   ```

5. **Fix permissions:**
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

### Issue: TypeScript compilation errors

**Symptoms:**
- Type errors during build
- Missing type definitions

**Solutions:**

1. **Install missing types:**
   ```bash
   npm install --save-dev @types/node @types/express
   ```

2. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```

3. **Clean and rebuild:**
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

## Build & Development Issues

### Issue: Build fails

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Missing files

**Solutions:**

1. **Check for TypeScript errors:**
   ```bash
   npm run build 2>&1 | grep error
   ```

2. **Verify tsconfig.json:**
   ```bash
   npx tsc --showConfig
   ```

3. **Clean build:**
   ```bash
   rm -rf dist
   npm run build
   ```

### Issue: Development server won't start

**Symptoms:**
- `npm run start:dev` fails
- Port already in use
- Module not found errors

**Solutions:**

1. **Check if port is in use:**
   ```bash
   # Linux/Mac
   lsof -i :3001
   
   # Windows
   netstat -ano | findstr :3001
   ```

2. **Kill process using port:**
   ```bash
   # Linux/Mac
   kill -9 $(lsof -t -i:3001)
   
   # Windows
   taskkill /PID <pid> /F
   ```

3. **Use different port:**
   ```bash
   PORT=3002 npm run start:dev
   ```

4. **Check for missing modules:**
   ```bash
   npm install
   ```

### Issue: Hot reload not working

**Symptoms:**
- Changes not reflected
- Server not restarting

**Solutions:**

1. **Check file watchers:**
   ```bash
   # Increase file watcher limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server:**
   ```bash
   # Stop and restart
   npm run start:dev
   ```

3. **Check for file system issues:**
   - Ensure files are saved
   - Check file permissions
   - Verify no symlink issues

## Runtime Issues

### Issue: Application crashes on startup

**Symptoms:**
- Application exits immediately
- Error messages in console
- No logs

**Solutions:**

1. **Check environment variables:**
   ```bash
   echo $JWT_SECRET
   echo $FRONTEND_URL
   ```

2. **Run with debug logging:**
   ```bash
   DEBUG=* npm run start:prod
   ```

3. **Check for missing dependencies:**
   ```bash
   npm install --production
   ```

4. **Verify build output:**
   ```bash
   ls -la dist/
   ```

### Issue: Application runs but API doesn't respond

**Symptoms:**
- Server starts successfully
- API endpoints return errors
- 404 or 500 errors

**Solutions:**

1. **Check if server is listening:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check CORS configuration:**
   - Verify `FRONTEND_URL` matches frontend URL
   - Check CORS middleware is enabled

3. **Check route registration:**
   - Verify controllers are registered in modules
   - Check module imports in `app.module.ts`

4. **Check logs:**
   ```bash
   # PM2 logs
   pm2 logs ai-orchestrator
   
   # Docker logs
   docker logs ai-orchestrator
   ```

### Issue: Memory leaks

**Symptoms:**
- Memory usage continuously increases
- Application becomes slow
- Crashes after running for a while

**Solutions:**

1. **Monitor memory usage:**
   ```bash
   # PM2
   pm2 monit
   
   # Docker
   docker stats ai-orchestrator
   ```

2. **Check for unclosed connections:**
   - WebSocket connections
   - Database connections
   - HTTP connections

3. **Enable garbage collection logging:**
   ```bash
   node --expose-gc dist/main.js
   ```

4. **Restart periodically:**
   ```bash
   # PM2 auto-restart
   pm2 start dist/main.js --max-memory-restart 500M
   ```

## API Issues

### Issue: 401 Unauthorized errors

**Symptoms:**
- Authentication fails
- JWT token rejected
- Login endpoint returns 401

**Solutions:**

1. **Check JWT secret:**
   ```bash
   echo $JWT_SECRET
   # Ensure it matches between services
   ```

2. **Verify token format:**
   - Token should start with `Bearer `
   - Token should be valid JWT format

3. **Check token expiration:**
   - Default is 24 hours
   - Verify `JWT_EXPIRES_IN` is set correctly

4. **Check authentication guard:**
   - Verify `@UseGuards(JwtAuthGuard)` is applied
   - Check JWT strategy is configured

### Issue: 404 Not Found errors

**Symptoms:**
- API endpoints return 404
- Routes not found

**Solutions:**

1. **Check route paths:**
   - Verify controller paths match
   - Check for typos in routes

2. **Check module registration:**
   - Ensure controllers are in modules
   - Verify modules are imported in `app.module.ts`

3. **Check base path:**
   - Verify no global prefix conflicts
   - Check route prefixes

### Issue: 500 Internal Server Error

**Symptoms:**
- API returns 500 errors
- Generic error messages

**Solutions:**

1. **Check server logs:**
   ```bash
   pm2 logs ai-orchestrator --lines 100
   ```

2. **Enable detailed error logging:**
   - Set `NODE_ENV=development` temporarily
   - Check for stack traces

3. **Check for unhandled errors:**
   - Add try-catch blocks
   - Check for null/undefined values

4. **Verify dependencies:**
   - Check all required services are running
   - Verify database connections (if applicable)

## WebSocket Issues

### Issue: WebSocket connection fails

**Symptoms:**
- Cannot connect to WebSocket
- Connection timeout
- 401 Unauthorized

**Solutions:**

1. **Check authentication:**
   - Verify JWT token is valid
   - Check token is passed in query string
   - Ensure token hasn't expired

2. **Check WebSocket path:**
   ```
   ws://localhost:3001/ws/transcription?token=YOUR_TOKEN
   ```

3. **Check CORS:**
   - Verify WebSocket origin is allowed
   - Check CORS configuration

4. **Check firewall:**
   - Ensure port 3001 is open
   - Check security groups (AWS)

### Issue: WebSocket disconnects frequently

**Symptoms:**
- Connection drops
- Reconnection loops
- Intermittent connectivity

**Solutions:**

1. **Check network stability:**
   - Test with different networks
   - Check for packet loss

2. **Increase timeout:**
   - Configure WebSocket ping/pong
   - Increase connection timeout

3. **Check server resources:**
   - Monitor CPU and memory
   - Check for resource exhaustion

4. **Implement reconnection logic:**
   - Add exponential backoff
   - Handle reconnection in client

### Issue: WebSocket events not received

**Symptoms:**
- Connection successful
- No events received
- Events delayed

**Solutions:**

1. **Check event names:**
   - Verify event names match
   - Check for typos

2. **Check event emission:**
   - Verify events are being emitted
   - Check server logs

3. **Check client listeners:**
   - Verify event listeners are registered
   - Check for multiple connections

## Authentication Issues

### Issue: Login fails

**Symptoms:**
- Login endpoint returns error
- Invalid credentials
- Token not generated

**Solutions:**

1. **Check credentials:**
   - Verify email and password
   - Check for mock credentials in development

2. **Check password hashing:**
   - Verify bcrypt is working
   - Check password comparison

3. **Check JWT generation:**
   - Verify JWT_SECRET is set
   - Check JWT payload

4. **Check logs:**
   ```bash
   pm2 logs ai-orchestrator | grep login
   ```

### Issue: Token validation fails

**Symptoms:**
- Valid token rejected
- 401 errors with valid token

**Solutions:**

1. **Check JWT secret:**
   - Ensure same secret used for signing and validation
   - Check for secret rotation

2. **Check token format:**
   - Verify Bearer token format
   - Check token extraction

3. **Check token expiration:**
   - Verify token hasn't expired
   - Check clock skew

## Performance Issues

### Issue: Slow API responses

**Symptoms:**
- High response times
- Timeout errors
- Slow WebSocket events

**Solutions:**

1. **Check database queries:**
   - Optimize queries
   - Add indexes
   - Use connection pooling

2. **Check external services:**
   - Verify external APIs are responsive
   - Add timeouts
   - Implement caching

3. **Check server resources:**
   - Monitor CPU and memory
   - Scale horizontally
   - Optimize code

4. **Enable compression:**
   ```typescript
   app.use(compression());
   ```

### Issue: High memory usage

**Symptoms:**
- Memory continuously increases
- Application crashes
- Slow performance

**Solutions:**

1. **Check for memory leaks:**
   - Profile memory usage
   - Check for unclosed connections
   - Review event listeners

2. **Limit memory:**
   ```bash
   # PM2
   pm2 start dist/main.js --max-memory-restart 500M
   ```

3. **Optimize data structures:**
   - Use streaming for large data
   - Implement pagination
   - Clear caches periodically

## Deployment Issues

### Issue: Docker build fails

**Symptoms:**
- Docker build errors
- Missing files
- Permission errors

**Solutions:**

1. **Check Dockerfile:**
   - Verify paths are correct
   - Check build context

2. **Check .dockerignore:**
   - Ensure necessary files aren't ignored
   - Verify node_modules is ignored

3. **Build with verbose output:**
   ```bash
   docker build --progress=plain -t ai-orchestrator .
   ```

### Issue: Deployment fails on platform

**Symptoms:**
- Deployment errors
- Application won't start
- Environment issues

**Solutions:**

1. **Check environment variables:**
   - Verify all required variables are set
   - Check for typos

2. **Check platform logs:**
   - Review deployment logs
   - Check application logs

3. **Test locally:**
   - Replicate production environment
   - Test with production build

4. **Check platform requirements:**
   - Verify Node.js version
   - Check memory/CPU limits

## Getting Help

If you're still experiencing issues:

1. **Check logs:**
   ```bash
   pm2 logs ai-orchestrator
   docker logs ai-orchestrator
   ```

2. **Review documentation:**
   - [README.md](./README.md)
   - [SETUP.md](./SETUP.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)

3. **Search existing issues:**
   - Check GitHub issues
   - Search for similar problems

4. **Create detailed issue:**
   - Describe the problem
   - Include error messages
   - Provide steps to reproduce
   - Include environment details
   - Attach relevant logs

### Information to Include

When reporting issues, include:

- Node.js version: `node --version`
- npm version: `npm --version`
- Operating system
- Error messages
- Stack traces
- Steps to reproduce
- Expected vs actual behavior
- Environment variables (without secrets)

---

**Last Updated:** January 2026
