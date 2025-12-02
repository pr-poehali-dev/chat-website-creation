import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type Tab = 'messages' | 'search' | 'profile' | 'settings';

const mockChats = [
  { id: 1, name: 'Анна Иванова', avatar: '🎨', lastMessage: 'Привет! Как дела?', time: '12:45', unread: 3, online: true },
  { id: 2, name: 'Максим Петров', avatar: '🚀', lastMessage: 'Спасибо за помощь!', time: '11:20', unread: 0, online: true },
  { id: 3, name: 'Ольга Сидорова', avatar: '📚', lastMessage: 'До встречи завтра', time: 'Вчера', unread: 1, online: false },
  { id: 4, name: 'Дмитрий Ковалёв', avatar: '💼', lastMessage: 'Отправил документы', time: '2 дня назад', unread: 0, online: false },
];

const mockContacts = [
  { id: 1, name: 'Анна Иванова', avatar: '🎨', status: 'Дизайнер', online: true },
  { id: 2, name: 'Максим Петров', avatar: '🚀', status: 'Разработчик', online: true },
  { id: 3, name: 'Ольга Сидорова', avatar: '📚', status: 'Писатель', online: false },
  { id: 4, name: 'Дмитрий Ковалёв', avatar: '💼', status: 'Менеджер', online: false },
  { id: 5, name: 'Елена Смирнова', avatar: '🎭', status: 'Актриса', online: true },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState({
    messages: true,
    mentions: true,
    sounds: false,
  });

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = mockChats.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row h-screen">
          <aside className="w-full md:w-20 bg-card border-r border-border flex md:flex-col items-center py-6 gap-6">
            <div className="hidden md:block text-3xl mb-4">💬</div>
            
            <nav className="flex md:flex-col gap-2 w-full px-4 md:px-0">
              <button
                onClick={() => setActiveTab('messages')}
                className={`relative p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'messages' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="MessageSquare" size={24} />
                {totalUnread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Search" size={24} />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="User" size={24} />
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`p-3 rounded-xl transition-all hover:bg-muted ${
                  activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Settings" size={24} />
              </button>
            </nav>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'messages' && (
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-semibold mb-2">Сообщения</h1>
                  <p className="text-muted-foreground">Все ваши диалоги в одном месте</p>
                </div>

                <div className="space-y-2">
                  {mockChats.map((chat) => (
                    <Card key={chat.id} className="hover:bg-muted/50 transition-all cursor-pointer border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="text-2xl">{chat.avatar}</AvatarFallback>
                            </Avatar>
                            {chat.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate">{chat.name}</h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {chat.time}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>

                          {chat.unread > 0 && (
                            <Badge className="bg-primary">{chat.unread}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-semibold mb-2">Поиск</h1>
                  <p className="text-muted-foreground">Найдите нужных людей</p>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Поиск по имени..."
                      className="pl-10 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <Card key={contact.id} className="hover:bg-muted/50 transition-all cursor-pointer border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="text-2xl">{contact.avatar}</AvatarFallback>
                            </Avatar>
                            {contact.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1">{contact.name}</h3>
                            <p className="text-sm text-muted-foreground">{contact.status}</p>
                          </div>

                          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <Icon name="Plus" size={20} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredContacts.length === 0 && (
                    <div className="text-center py-12">
                      <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Ничего не найдено</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-semibold mb-2">Профиль</h1>
                  <p className="text-muted-foreground">Ваша персональная информация</p>
                </div>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-4xl">👤</AvatarFallback>
                      </Avatar>
                      <h2 className="text-2xl font-semibold mb-1">Александр Новиков</h2>
                      <p className="text-muted-foreground mb-2">@alex_novikov</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        <span>Онлайн</span>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">О себе</h3>
                        <p className="text-sm">Люблю общаться и знакомиться с новыми людьми</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-sm">alex.novikov@example.com</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Телефон</h3>
                        <p className="text-sm">+7 (999) 123-45-67</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Дата регистрации</h3>
                        <p className="text-sm">15 января 2024</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-semibold mb-2">Настройки</h1>
                  <p className="text-muted-foreground">Управление уведомлениями и настройками</p>
                </div>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="messages" className="text-base font-medium">
                            Новые сообщения
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Получать уведомления о новых сообщениях
                          </p>
                        </div>
                        <Switch
                          id="messages"
                          checked={notifications.messages}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, messages: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="mentions" className="text-base font-medium">
                            Упоминания
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Когда вас упоминают в сообщениях
                          </p>
                        </div>
                        <Switch
                          id="mentions"
                          checked={notifications.mentions}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, mentions: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="sounds" className="text-base font-medium">
                            Звуковые уведомления
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Воспроизводить звук при получении уведомлений
                          </p>
                        </div>
                        <Switch
                          id="sounds"
                          checked={notifications.sounds}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, sounds: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Аккаунт</h3>
                    
                    <div className="space-y-4">
                      <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                        <Icon name="Lock" size={20} className="text-muted-foreground" />
                        <span>Изменить пароль</span>
                      </button>

                      <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                        <Icon name="Mail" size={20} className="text-muted-foreground" />
                        <span>Изменить email</span>
                      </button>

                      <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 text-destructive">
                        <Icon name="Trash2" size={20} />
                        <span>Удалить аккаунт</span>
                      </button>
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
