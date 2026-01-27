"""
AWS Lambda function to handle GitHub webhooks and trigger CodeBuild
"""
import json
import hmac
import hashlib
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS_REGION is automatically available in Lambda runtime
codebuild = boto3.client('codebuild', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

# CodeBuild project name
CODEBUILD_PROJECT = os.environ.get('CODEBUILD_PROJECT', 'ai-im-agent-backend-build')

# GitHub webhook secret (stored in environment variable or Secrets Manager)
GITHUB_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', '')

def verify_signature(payload_body, signature_header):
    """
    Verify GitHub webhook signature using HMAC SHA256
    """
    if not GITHUB_SECRET:
        logger.warning("GITHUB_WEBHOOK_SECRET not set, skipping signature verification")
        return True
    
    if not signature_header:
        logger.error("Missing signature header")
        return False
    
    # GitHub sends signature as: sha256=<hash>
    if not signature_header.startswith('sha256='):
        logger.error("Invalid signature format")
        return False
    
    # Extract hash
    signature_hash = signature_header[7:]
    
    # Calculate expected hash
    expected_hash = hmac.new(
        GITHUB_SECRET.encode('utf-8'),
        payload_body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    return hmac.compare_digest(signature_hash, expected_hash)

def lambda_handler(event, context):
    """
    Lambda handler for GitHub webhook
    """
    try:
        # Get request body
        if isinstance(event.get('body'), str):
            body = event['body']
        else:
            body = json.dumps(event.get('body', {}))
        
        # Get headers (case-insensitive)
        headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
        
        # Verify signature
        signature = headers.get('x-hub-signature-256', '')
        if not verify_signature(body, signature):
            logger.error("Invalid webhook signature")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }
        
        # Parse webhook payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON payload")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON'})
            }
        
        # Get event type
        event_type = headers.get('x-github-event', '')
        logger.info(f"Received GitHub event: {event_type}")
        
        # Only process push events
        if event_type != 'push':
            logger.info(f"Ignoring event type: {event_type}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': f'Event {event_type} ignored'})
            }
        
        # Get branch information
        ref = payload.get('ref', '')
        branch = ref.replace('refs/heads/', '')
        
        # Only trigger on main branch
        if branch != 'main':
            logger.info(f"Ignoring branch: {branch}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': f'Branch {branch} ignored'})
            }
        
        # Get commit information
        commit = payload.get('head_commit', {})
        commit_id = commit.get('id', '')[:7]
        commit_message = commit.get('message', '')
        author = commit.get('author', {}).get('name', 'Unknown')
        
        logger.info(f"Triggering build for branch: {branch}, commit: {commit_id}")
        
        # Start CodeBuild
        try:
            response = codebuild.start_build(
                projectName=CODEBUILD_PROJECT,
                sourceVersion=f'refs/heads/{branch}',
                environmentVariablesOverride=[
                    {
                        'name': 'GIT_COMMIT',
                        'value': commit_id
                    },
                    {
                        'name': 'GIT_COMMIT_MESSAGE',
                        'value': commit_message[:255]  # Limit length
                    },
                    {
                        'name': 'GIT_AUTHOR',
                        'value': author
                    }
                ]
            )
            
            build_id = response['build']['id']
            build_arn = response['build']['arn']
            
            logger.info(f"Build started: {build_id}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Build triggered successfully',
                    'buildId': build_id,
                    'buildArn': build_arn,
                    'branch': branch,
                    'commit': commit_id
                })
            }
            
        except Exception as e:
            logger.error(f"Error starting build: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to start build: {str(e)}'})
            }
    
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
