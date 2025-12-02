import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get list of users from contacts and manage online status
    Args: event with httpMethod, queryStringParameters, headers with X-User-Id
    Returns: HTTP response with users list from contacts
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if method == 'PUT' and user_id:
        dsn = os.environ.get('DATABASE_URL')
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                    (int(user_id),)
                )
                conn.commit()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': 'online'})
        }
    
    if method == 'POST' and user_id:
        body_data = json.loads(event.get('body', '{}'))
        contacts = body_data.get('contacts', [])
        
        dsn = os.environ.get('DATABASE_URL')
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                for phone in contacts:
                    cur.execute(
                        "INSERT INTO contacts (user_id, contact_phone) VALUES (%s, %s) ON CONFLICT (user_id, contact_phone) DO NOTHING",
                        (int(user_id), phone)
                    )
                conn.commit()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': 'contacts synced'})
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    query_params = event.get('queryStringParameters') or {}
    search = query_params.get('search', '').strip()
    
    dsn = os.environ.get('DATABASE_URL')
    
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            if search:
                cur.execute(
                    """
                    SELECT DISTINCT u.id, u.display_name, u.avatar, u.status, u.is_online, u.last_seen 
                    FROM users u
                    INNER JOIN contacts c ON u.phone = c.contact_phone
                    WHERE c.user_id = %s 
                    AND (u.display_name ILIKE %s OR u.username ILIKE %s)
                    ORDER BY u.display_name
                    """,
                    (int(user_id), f'%{search}%', f'%{search}%')
                )
            else:
                cur.execute(
                    """
                    SELECT DISTINCT u.id, u.display_name, u.avatar, u.status, u.is_online, u.last_seen 
                    FROM users u
                    INNER JOIN contacts c ON u.phone = c.contact_phone
                    WHERE c.user_id = %s
                    ORDER BY u.display_name
                    """,
                    (int(user_id),)
                )
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'name': row[1],
                    'avatar': row[2],
                    'status': row[3],
                    'online': row[4] if row[4] is not None else False
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users})
            }