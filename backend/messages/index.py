import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send, retrieve and delete messages between users
    Args: event with httpMethod, body, headers
    Returns: HTTP response with messages or status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'})
        }
    
    user_id = int(user_id_str)
    dsn = os.environ.get('DATABASE_URL')
    
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            if method == 'GET':
                query_params = event.get('queryStringParameters') or {}
                other_user_id = query_params.get('userId')
                
                if other_user_id:
                    cur.execute("""
                        SELECT m.id, m.sender_id, m.receiver_id, m.message_text, m.is_read, m.created_at,
                               u1.display_name as sender_name, u1.avatar as sender_avatar,
                               u2.display_name as receiver_name, u2.avatar as receiver_avatar
                        FROM messages m
                        JOIN users u1 ON m.sender_id = u1.id
                        JOIN users u2 ON m.receiver_id = u2.id
                        WHERE (m.sender_id = %s AND m.receiver_id = %s) OR (m.sender_id = %s AND m.receiver_id = %s)
                        ORDER BY m.created_at ASC
                    """, (user_id, int(other_user_id), int(other_user_id), user_id))
                    
                    messages = []
                    for row in cur.fetchall():
                        messages.append({
                            'id': row[0],
                            'sender_id': row[1],
                            'receiver_id': row[2],
                            'message_text': row[3],
                            'is_read': row[4],
                            'created_at': row[5].isoformat(),
                            'sender_name': row[6],
                            'sender_avatar': row[7],
                            'receiver_name': row[8],
                            'receiver_avatar': row[9]
                        })
                    
                    cur.execute(
                        "UPDATE messages SET is_read = TRUE WHERE receiver_id = %s AND sender_id = %s AND is_read = FALSE",
                        (user_id, int(other_user_id))
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'messages': messages})
                    }
                else:
                    cur.execute("""
                        SELECT DISTINCT ON (other_user_id) 
                            other_user_id, u.display_name, u.avatar, u.status,
                            m.message_text as last_message,
                            m.created_at,
                            (SELECT COUNT(*) FROM messages WHERE receiver_id = %s AND sender_id = other_user_id AND is_read = FALSE) as unread_count
                        FROM (
                            SELECT 
                                CASE WHEN sender_id = %s THEN receiver_id ELSE sender_id END as other_user_id,
                                id, message_text, created_at
                            FROM messages
                            WHERE sender_id = %s OR receiver_id = %s
                        ) m
                        JOIN users u ON u.id = m.other_user_id
                        ORDER BY other_user_id, m.created_at DESC
                    """, (user_id, user_id, user_id, user_id))
                    
                    chats = []
                    for row in cur.fetchall():
                        chats.append({
                            'id': row[0],
                            'name': row[1],
                            'avatar': row[2],
                            'status': row[3],
                            'lastMessage': row[4],
                            'time': row[5].isoformat(),
                            'unread': row[6]
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'chats': chats})
                    }
            
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters') or {}
                message_id = query_params.get('messageId')
                
                if not message_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Message ID required'})
                    }
                
                cur.execute(
                    "DELETE FROM messages WHERE id = %s AND sender_id = %s",
                    (int(message_id), user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'status': 'message deleted'})
                }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                receiver_id = body_data.get('receiver_id')
                message_text = body_data.get('message_text', '').strip()
                
                if not receiver_id or not message_text:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Receiver ID and message text required'})
                    }
                
                cur.execute(
                    "INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (user_id, receiver_id, message_text)
                )
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': {
                            'id': result[0],
                            'sender_id': user_id,
                            'receiver_id': receiver_id,
                            'message_text': message_text,
                            'created_at': result[1].isoformat()
                        }
                    })
                }
            
            else:
                return {
                    'statusCode': 405,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Method not allowed'})
                }