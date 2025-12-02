import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const API = {
  auth: 'https://functions.poehali.dev/7eca7473-b684-41a7-9cc0-2cda56ff03f7',
  users: 'https://functions.poehali.dev/cad0ecb1-e254-4f8a-a942-1a23f41abefc',
  messages: 'https://functions.poehali.dev/62e8ab46-bd47-4349-a92a-883ed3105455',
};

type Tab = 'messages' | 'search' | 'profile' | 'settings' | 'chat';

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  status: string;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  status: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    messages: true,
    mentions: true,
    sounds: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadChats();
      loadUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && selectedChat) {
      loadMessages(selectedChat);
      const interval = setInterval(() => {
        loadMessages(selectedChat);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedChat]);

  useEffect(() => {
    if (currentUser && activeTab === 'messages') {
      const interval = setInterval(() => {
        loadChats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (activeTab === 'search' && currentUser) {
      const timer = setTimeout(() => {
        loadUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab, currentUser]);

  const handleAuth = async () => {
    setError('');
    
    if (!isLogin && !phone) {
      setError('Укажите номер телефона');
      return;
    }
    
    try {
      const res = await fetch(API.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          username,
          password,
          phone: phone || undefined,
          display_name: displayName || username,
          avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка');
        return;
      }
      setCurrentUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(API.messages, {
        headers: { 'X-User-Id': String(currentUser.id) },
      });
      const data = await res.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async (search = '') => {
    if (!currentUser) return;
    try {
      const url = search ? `${API.users}?search=${encodeURIComponent(search)}` : API.users;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users.filter((u: any) => u.id !== currentUser.id));
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (userId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API.messages}?userId=${userId}`, {
        headers: { 'X-User-Id': String(currentUser.id) },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedChat) return;
    if (!newMessage.trim() && !selectedImage) return;
    
    try {
      const messageContent = selectedImage || newMessage;
      await fetch(API.messages, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(currentUser.id),
        },
        body: JSON.stringify({
          receiver_id: selectedChat,
          message_text: messageContent,
        }),
      });
      setNewMessage('');
      setSelectedImage(null);
      loadMessages(selectedChat);
      loadChats();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setUsername('');
    setPassword('');
    setDisplayName('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">💬</div>
              <h1 className="text-2xl font-bold">Чат</h1>
              <p className="text-muted-foreground">{isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Логин</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <div>
                <Label>Пароль</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              {!isLogin && (
                <>
                  <div>
                    <Label>Номер телефона</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <Label>Отображаемое имя</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <Label>Аватар</Label>
                    <div className="flex items-center gap-3">
                      {(avatarPreview || avatar) && (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{avatar}</span>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAvatarFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAvatarPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    <Input
                      value={avatar}
                      onChange={(e) => {
                        setAvatar(e.target.value);
                        setAvatarPreview('');
                        setAvatarFile(null);
                      }}
                      placeholder="👤 или загрузите фото"
                      maxLength={2}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
              <Button onClick={handleAuth} className="w-full">
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Button>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
              
              {!isLogin && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center mb-2">Быстрая регистрация:</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['🎨', '🚀', '📚', '💼', '🎭', '⚡', '🌟', '🎯'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className="w-10 h-10 text-2xl hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users;

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread, 0);

  const selectedChatData = selectedChat
    ? chats.find((c) => c.id === selectedChat) || users.find((u) => u.id === selectedChat)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row h-screen">
          <aside className="w-full md:w-20 bg-card border-r border-border flex md:flex-col items-center py-6 gap-6">
            <div className="hidden md:block text-3xl mb-4">💬</div>
            
            <nav className="flex md:flex-col gap-2 w-full px-4 md:px-0">
              <button
                onClick={() => { setActiveTab('messages'); setSelectedChat(null); }}
                className={`relative p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'messages' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="MessageSquare" size={24} />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('search'); setSelectedChat(null); }}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Search" size={24} />
              </button>

              <button
                onClick={() => { setActiveTab('profile'); setSelectedChat(null); }}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="User" size={24} />
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setSelectedChat(null); }}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Settings" size={24} />
              </button>
            </nav>

            <button
              onClick={logout}
              className="mt-auto p-3 rounded-xl text-muted-foreground hover:bg-muted transition-all"
            >
              <Icon name="LogOut" size={24} />
            </button>
          </aside>

          <main className="flex-1 flex flex-col">
            {activeTab === 'messages' && !selectedChat && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Сообщения</h2>
                  <div className="space-y-2">
                    {chats.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Нет сообщений</p>
                    ) : (
                      chats.map((chat) => (
                        <Card
                          key={chat.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedChat(chat.id);
                            setActiveTab('chat');
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarFallback className="text-2xl">{chat.avatar}</AvatarFallback>
                                </Avatar>
                                {chat.unread > 0 && (
                                  <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {chat.unread}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium truncate">{chat.name}</h3>
                                  <span className="text-xs text-muted-foreground">{new Date(chat.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && selectedChat && (
              <div className="flex-1 flex flex-col">
                <div className="border-b border-border p-4 flex items-center gap-3">
                  <button onClick={() => { setSelectedChat(null); setActiveTab('messages'); }} className="md:hidden">
                    <Icon name="ArrowLeft" size={24} />
                  </button>
                  <Avatar>
                    <AvatarFallback className="text-2xl">{selectedChatData?.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedChatData?.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedChatData?.status}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser.id;
                    const isImage = msg.message_text.startsWith('data:image/');
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
                          {isImage ? (
                            <img src={msg.message_text} alt="Изображение" className="rounded-lg max-w-full" />
                          ) : (
                            <p>{msg.message_text}</p>
                          )}
                          <span className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border p-4">
                  {selectedImage && (
                    <div className="mb-2 relative inline-block">
                      <img src={selectedImage} alt="Предпросмотр" className="rounded-lg max-h-32" />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSelectedImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('image-upload')?.click()}
                      size="icon"
                      variant="outline"
                    >
                      <Icon name="Image" size={20} />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Написать сообщение..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Icon name="Send" size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-4">Поиск</h2>
                <div className="relative mb-6">
                  <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или нику..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedChat(user.id);
                        setActiveTab('chat');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.status}</p>
                          </div>
                          {user.online && <Badge variant="secondary" className="ml-auto">Онлайн</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Профиль</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                      <Avatar className="w-24 h-24 mb-4">
                        <AvatarFallback className="text-5xl">{currentUser.avatar}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold">{currentUser.display_name}</h3>
                      <p className="text-muted-foreground">@{currentUser.username}</p>
                      <Badge variant="secondary" className="mt-2">Онлайн</Badge>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Статус</p>
                        <p className="font-medium">{currentUser.status}</p>
                      </div>
                      {(currentUser as any).phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Телефон</p>
                          <p className="font-medium">{(currentUser as any).phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Настройки</h2>
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">Профиль</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Предпросмотр" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">{currentUser.avatar}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <Label>Аватар</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setAvatarFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAvatarPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="cursor-pointer flex-1"
                            />
                          </div>
                          <Input
                            value={avatar}
                            onChange={(e) => {
                              setAvatar(e.target.value);
                              setAvatarPreview('');
                              setAvatarFile(null);
                            }}
                            placeholder="👤 или загрузите фото"
                            maxLength={2}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Отображаемое имя</Label>
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Ваше имя"
                        />
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            const newAvatar = avatarPreview || avatar;
                            await fetch(API.users, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-User-Id': String(currentUser.id),
                              },
                              body: JSON.stringify({
                                display_name: displayName,
                                avatar: newAvatar,
                              }),
                            });
                            const updatedUser = { ...currentUser, display_name: displayName, avatar: newAvatar };
                            setCurrentUser(updatedUser);
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                            setAvatarPreview('');
                            setAvatarFile(null);
                            setAvatar(newAvatar);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full"
                      >
                        Сохранить изменения
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Уведомления</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="msg-notif" className="cursor-pointer">
                            Новые сообщения
                          </Label>
                          <Switch
                            id="msg-notif"
                            checked={notifications.messages}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, messages: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mention-notif" className="cursor-pointer">
                            Упоминания
                          </Label>
                          <Switch
                            id="mention-notif"
                            checked={notifications.mentions}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, mentions: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sound-notif" className="cursor-pointer">
                            Звуковые уведомления
                          </Label>
                          <Switch
                            id="sound-notif"
                            checked={notifications.sounds}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, sounds: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}