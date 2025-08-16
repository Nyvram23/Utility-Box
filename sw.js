// Service Worker - Utility Box
// Funcionalidade offline, cache inteligente e sincronização em background

const CACHE_NAME = 'utilitybox-v3.0.0';
const STATIC_CACHE = 'utilitybox-static-v3.0.0';
const DYNAMIC_CACHE = 'utilitybox-dynamic-v3.0.0';

// Arquivos para cache estático
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/tools.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/notes.js',
    '/js/calculator.js',
    '/js/postits.js',
    '/js/tasks.js',
    '/js/solitaire.js',
    '/js/auth.js',
    '/js/api.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
    STATIC: 'cache-first',
    DYNAMIC: 'network-first',
    API: 'network-first'
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Cache estático criado');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Service Worker instalado com sucesso');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Erro na instalação:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker ativando...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Cache antigo removido:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker ativado');
                return self.clients.claim();
            })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Estratégia baseada no tipo de requisição
    if (isStaticFile(url.pathname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isAPIRequest(url.pathname)) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
});

// Estratégia Cache First (para arquivos estáticos)
async function cacheFirst(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Erro na estratégia cache-first:', error);
        return new Response('Erro de rede', { status: 503 });
    }
}

// Estratégia Network First (para dados dinâmicos)
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Rede indisponível, usando cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para páginas
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Conteúdo não disponível offline', { status: 503 });
    }
}

// Verificar se é arquivo estático
function isStaticFile(pathname) {
    return pathname.match(/\.(css|js|html|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Verificar se é requisição de API
function isAPIRequest(pathname) {
    return pathname.startsWith('/api/') || pathname.includes('utilitybox.cloud');
}

// Sincronização em background
self.addEventListener('sync', (event) => {
    console.log('🔄 Sincronização em background:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(backgroundSync());
    }
}

// Função de sincronização em background
async function backgroundSync() {
    try {
        const clients = await self.clients.matchAll();
        
        for (const client of clients) {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                action: 'syncData'
            });
        }
        
        console.log('✅ Sincronização em background concluída');
    } catch (error) {
        console.error('❌ Erro na sincronização em background:', error);
    }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_DATA':
            cacheData(data);
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo(event.source);
            break;
            
        case 'CLEAR_CACHE':
            clearCache();
            break;
            
        default:
            console.log('Mensagem não reconhecida:', type);
    }
});

// Cache de dados dinâmicos
async function cacheData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/api/data/${data.type}`, response);
        console.log('📦 Dados cacheados:', data.type);
    } catch (error) {
        console.error('❌ Erro ao cachear dados:', error);
    }
}

// Obter informações do cache
async function getCacheInfo(client) {
    try {
        const staticCache = await caches.open(STATIC_CACHE);
        const dynamicCache = await caches.open(DYNAMIC_CACHE);
        
        const staticKeys = await staticCache.keys();
        const dynamicKeys = await dynamicCache.keys();
        
        client.postMessage({
            type: 'CACHE_INFO',
            data: {
                static: staticKeys.length,
                dynamic: dynamicKeys.length,
                total: staticKeys.length + dynamicKeys.length
            }
        });
    } catch (error) {
        console.error('❌ Erro ao obter informações do cache:', error);
    }
}

// Limpar cache
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(name => caches.delete(name))
        );
        
        console.log('🗑️ Cache limpo com sucesso');
        
        // Notificar clientes
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CACHE_CLEARED',
                success: true
            });
        });
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
    }
}

// Push notifications (para funcionalidade futura)
self.addEventListener('push', (event) => {
    console.log('📱 Push notification recebida');
    
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação do Utility Box',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Abrir',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Utility Box', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Notificação fechada
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notificação fechada');
});

// Tratamento de erros
self.addEventListener('error', (event) => {
    console.error('❌ Erro no Service Worker:', event.error);
});

// Rejeição de promises não tratadas
self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
});

console.log('🔄 Service Worker carregado');
