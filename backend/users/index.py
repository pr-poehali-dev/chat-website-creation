import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get list of all users for search
    Args: event with httpMethod, queryStringParameters
    Returns: HTTP response with users list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    query_params = event.get('queryStringParameters') or {}
    search = query_params.get('search', '').strip()
    
    dsn = os.environ.get('DATABASE_URL')
    
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            if search:
                cur.execute(
                    "SELECT id, display_name, avatar, status FROM users WHERE display_name ILIKE %s OR username ILIKE %s ORDER BY display_name",
                    (f'%{search}%', f'%{search}%')
                )
            else:
                cur.execute("SELECT id, display_name, avatar, status FROM users ORDER BY display_name")
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'name': row[1],
                    'avatar': row[2],
                    'status': row[3],
                    'online': True
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users})
            }