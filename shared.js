// shared.js - CORE DEL SISTEMA GIMNASIO - VERSION COMPLETA

// ===== GESTIÓN DE BASE DE DATOS =====
class LocalStorageDriver {
    static create(table, data) {
        const items = this.getAll(table);
        const newItem = {
            id: this.generateId(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        items.push(newItem);
        localStorage.setItem(`gym_${table}`, JSON.stringify(items));
        console.log(`✅ ${table} creado:`, newItem);
        return newItem;
    }

    static read(table, filters = {}) {
        const items = this.getAll(table);
        if (Object.keys(filters).length === 0) return items;
        
        return items.filter(item => {
            return Object.keys(filters).every(key => {
                if (key === 'date_from' && item.created_at) {
                    return new Date(item.created_at) >= new Date(filters[key]);
                }
                if (key === 'date_to' && item.created_at) {
                    return new Date(item.created_at) <= new Date(filters[key]);
                }
                return item[key] === filters[key];
            });
        });
    }

    static update(table, id, data) {
        const items = this.getAll(table);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = {
                ...items[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem(`gym_${table}`, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    static delete(table, id) {
        const items = this.getAll(table);
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(`gym_${table}`, JSON.stringify(filteredItems));
        return true;
    }

    static getAll(table) {
        const data = localStorage.getItem(`gym_${table}`);
        return data ? JSON.parse(data) : [];
    }

    static generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

class DatabaseAdapter {
    constructor(driver = 'localStorage') {
        this.driver = driver;
    }

    async create(table, data) {
        return LocalStorageDriver.create(table, data);
    }

    async read(table, filters = {}) {
        return LocalStorageDriver.read(table, filters);
    }

    async update(table, id, data) {
        return LocalStorageDriver.update(table, id, data);
    }

    async delete(table, id) {
        return LocalStorageDriver.delete(table, id);
    }
}

// ===== AUTENTICACIÓN Y USUARIOS =====
class AuthManager {
    static login(email, password) {
        console.log('🔐 Intentando login con:', { email, password });
        
        const users = LocalStorageDriver.getAll('users');
        console.log('👥 Usuarios en sistema:', users);
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('gym_current_user', JSON.stringify(user));
            console.log('✅ Login exitoso:', user);
            return user;
        }
        
        console.log('❌ Login fallido - Credenciales incorrectas');
        return null;
    }

    static register(userData) {
        console.log('📝 Registrando nuevo usuario:', userData);
        
        const users = LocalStorageDriver.getAll('users');
        const existingUser = users.find(u => u.email === userData.email);
        
        if (existingUser) {
            throw new Error('El usuario ya existe');
        }

        const newUser = LocalStorageDriver.create('users', {
            ...userData,
            role: userData.role || 'member',
            status: 'active'
        });
        
        localStorage.setItem('gym_current_user', JSON.stringify(newUser));
        console.log('✅ Usuario registrado:', newUser);
        return newUser;
    }

    static getCurrentUser() {
        const user = localStorage.getItem('gym_current_user');
        return user ? JSON.parse(user) : null;
    }

    static logout() {
        localStorage.removeItem('gym_current_user');
        console.log('👋 Usuario deslogueado');
    }

    static hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const roleHierarchy = { 'admin': 3, 'coach': 2, 'member': 1 };
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }

    static initializeDefaultData() {
        console.log('🚀 Inicializando datos por defecto...');
        
        // Verificar y crear usuarios admin y coach
        const users = LocalStorageDriver.getAll('users');
        console.log('👥 Usuarios existentes:', users);

        if (users.length === 0) {
            console.log('📦 Creando usuarios por defecto...');
            
            // Usuario Admin
            LocalStorageDriver.create('users', {
                name: 'Administrador',
                email: 'admin@gym.com',
                password: 'admin123',
                role: 'admin',
                status: 'active'
            });

            // Usuario Coach
            LocalStorageDriver.create('coaches', {
                name: 'Carlos',
                last_name: 'Rodríguez',
                phone: '3001234567',
                email: 'coach@gym.com',
                password: 'coach123',
                role: 'coach',
                specialty: 'fuerza',
                experience: 5,
                certifications: ['Certificado Internacional en Entrenamiento Personal'],
                start_time: '06:00',
                end_time: '22:00',
                work_days: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
                active: true
            });

            // También crear como usuario para login
            LocalStorageDriver.create('users', {
                name: 'Coach Principal',
                email: 'coach@gym.com',
                password: 'coach123',
                role: 'coach',
                status: 'active'
            });

            console.log('✅ Usuarios por defecto creados');
        }

        // Verificar y crear planes por defecto
        const plans = LocalStorageDriver.getAll('plans');
        if (plans.length === 0) {
            console.log('📦 Creando planes por defecto...');
            
            const defaultPlans = [
                { 
                    name: 'Plan Diario', 
                    price: 5000, 
                    duration_days: 1, 
                    features: ['Acceso por un día', 'Área de pesas', 'Área cardio'],
                    active: true
                },
                { 
                    name: 'Plan Semanal', 
                    price: 25000, 
                    duration_days: 7, 
                    features: ['Acceso 7 días', 'Todas las áreas', 'Lockers'],
                    active: true
                },
                { 
                    name: 'Plan Quincenal', 
                    price: 45000, 
                    duration_days: 15, 
                    features: ['Acceso 15 días', 'Todas las áreas', 'Lockers', '1 clase grupal'],
                    active: true
                },
                { 
                    name: 'Plan Mensual Básico', 
                    price: 80000, 
                    duration_days: 30, 
                    features: ['Acceso 30 días', 'Todas las áreas', 'Lockers', '2 clases grupales'],
                    active: true
                },
                { 
                    name: 'Plan Premium', 
                    price: 120000, 
                    duration_days: 30, 
                    features: ['Acceso ilimitado', 'Todas las áreas', 'Lockers', 'Clases grupales ilimitadas', 'Asesoría nutricional'],
                    active: true
                }
            ];
            
            defaultPlans.forEach(plan => {
                LocalStorageDriver.create('plans', plan);
            });
            
            console.log('✅ Planes por defecto creados');
        }

        // Verificar y crear productos de ejemplo
        const products = LocalStorageDriver.getAll('products');
        if (products.length === 0) {
            console.log('📦 Creando productos de ejemplo...');
            
            const sampleProducts = [
                {
                    name: 'Proteína Whey 2kg',
                    category: 'Suplementos',
                    price: 120000,
                    cost: 80000,
                    stock: 15,
                    min_stock: 5,
                    supplier: 'Suplementos S.A.',
                    active: true
                },
                {
                    name: 'Creatina Monohidratada',
                    category: 'Suplementos',
                    price: 80000,
                    cost: 50000,
                    stock: 20,
                    min_stock: 8,
                    supplier: 'NutriSport',
                    active: true
                },
                {
                    name: 'Agua 500ml',
                    category: 'Bebidas',
                    price: 3000,
                    cost: 1500,
                    stock: 50,
                    min_stock: 20,
                    active: true
                },
                {
                    name: 'Gatorade',
                    category: 'Bebidas',
                    price: 5000,
                    cost: 3000,
                    stock: 30,
                    min_stock: 10,
                    active: true
                }
            ];
            
            sampleProducts.forEach(product => {
                LocalStorageDriver.create('products', product);
            });
            
            console.log('✅ Productos de ejemplo creados');
        }

        // Verificar y crear miembros de ejemplo
        const members = LocalStorageDriver.getAll('members');
        if (members.length === 0) {
            console.log('📦 Creando miembros de ejemplo...');
            
            const plans = LocalStorageDriver.getAll('plans');
            const coaches = LocalStorageDriver.getAll('coaches');
            
            if (plans.length > 0 && coaches.length > 0) {
                const sampleMembers = [
                    {
                        name: 'Ana',
                        last_name: 'García',
                        phone: '3001112233',
                        email: 'ana@ejemplo.com',
                        plan_id: plans[2].id, // Plan Quincenal
                        coach_id: coaches[0].id,
                        status: 'active',
                        notes: 'Cliente preferencial'
                    },
                    {
                        name: 'Luis',
                        last_name: 'Martínez',
                        phone: '3004445566',
                        email: 'luis@ejemplo.com',
                        plan_id: plans[4].id, // Plan Premium
                        status: 'active'
                    },
                    {
                        name: 'María',
                        last_name: 'López',
                        phone: '3007778899',
                        email: 'maria@ejemplo.com',
                        plan_id: plans[1].id, // Plan Semanal
                        status: 'active'
                    }
                ];
                
                sampleMembers.forEach(member => {
                    LocalStorageDriver.create('members', member);
                });
                
                console.log('✅ Miembros de ejemplo creados');
            }
        }

        console.log('🎉 Inicialización completada');
        this.debugSystem();
    }

    static debugSystem() {
        console.log('=== 🐛 DEBUG DEL SISTEMA ===');
        console.log('👥 Usuarios:', LocalStorageDriver.getAll('users'));
        console.log('📋 Planes:', LocalStorageDriver.getAll('plans'));
        console.log('👨‍💼 Coaches:', LocalStorageDriver.getAll('coaches'));
        console.log('📦 Productos:', LocalStorageDriver.getAll('products'));
        console.log('👤 Miembros:', LocalStorageDriver.getAll('members'));
        console.log('============================');
    }
}

// ===== UTILIDADES =====
class Utilities {
    static generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static formatCurrency(amount) {
        if (!amount) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(date) {
        if (!date) return 'No especificado';
        return new Date(date).toLocaleDateString('es-CO');
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[0-9]{10,15}$/;
        return re.test(phone);
    }

    static showToast(message, type = 'success') {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        
        document.body.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 100);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// ===== GESTIÓN DE WHATSAPP =====
class WhatsAppManager {
    static sendMessage(phone, message) {
        if (!phone) {
            console.error('❌ No hay número de teléfono');
            Utilities.showToast('Error: No hay número de teléfono', 'error');
            return;
        }

        // Limpiar y formatear el número de teléfono
        const cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.length < 10) {
            console.error('❌ Número de teléfono inválido:', phone);
            Utilities.showToast('Número de teléfono inválido', 'error');
            return;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        console.log('📤 Enviando WhatsApp:', { phone: cleanPhone, message });
        window.open(whatsappUrl, '_blank');
        
        Utilities.showToast('WhatsApp abierto para enviar mensaje');
    }

    static getMessageTemplates() {
        return {
            payment_reminder: `¡Hola {nombre}! 👋\n\nRecordatorio amigable: Tu mensualidad del plan {plan} está por vencer. 📅\n\nMantén tus beneficios activos y continúa tu transformación con nosotros. 💪\n\n¡Gracias por ser parte de PowerGym! 🏋️‍♂️`,
            inactivity_7: `¡Hola {nombre}! 👋\n\nNotamos que hace 7 días no nos visitas en el gimnasio. ¿Todo bien? 💪\n\nTe extrañamos y queremos saber si necesitas ayuda con tu rutina.\n\n¡Esperamos verte pronto! 🏋️‍♂️`,
            inactivity_15: `¡Hola {nombre}! 👋\n\nTu cuerpo te está esperando en PowerGym! 💪\n\nHace 15 días que no nos visitas. ¿Necesitas ajustar tu rutina?\n\n¡Te esperamos! 🏋️‍♂️`,
            inactivity_30: `¡Hola {nombre}! 👋\n\nNotamos que hace 30 días no vienes al gimnasio. Tu salud es importante. 💪\n\n¿Hay algo en lo que podamos ayudarte?\n\n¡Tu lugar te espera! 🏋️‍♂️`,
            birthday: `¡Hola {nombre}! 🎉\n\n¡Todo el equipo de PowerGym te desea un FELIZ CUMPLEAÑOS! 🎂\n\nPara celebrar contigo, te regalamos un día extra en tu membresía.\n\n¡Que tengas un día maravilloso! 💪🎁`,
            promotion: `¡Hola {nombre}! 👋\n\nTenemos una PROMOCIÓN ESPECIAL para ti! 🎯\n\nEste mes tenemos descuentos exclusivos en suplementos.\n\n¡No te lo pierdas! 💪`
        };
    }
}

// ===== INICIALIZACIÓN GLOBAL =====
const DB = new DatabaseAdapter();

// Función global para forzar creación de usuarios
function forceCreateUsers() {
    console.log('🛠️ Forzando creación de usuarios...');
    
    // Limpiar datos existentes
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('gym_')) {
            localStorage.removeItem(key);
        }
    });
    
    // Crear usuarios directamente
    const users = [
        {
            id: 'admin_force',
            name: 'Administrador',
            email: 'admin@gym.com',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'coach_force', 
            name: 'Coach Principal',
            email: 'coach@gym.com',
            password: 'coach123',
            role: 'coach',
            status: 'active',
            created_at: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('gym_users', JSON.stringify(users));
    console.log('✅ Usuarios forzados creados:', users);
    
    // Inicializar el resto de datos
    AuthManager.initializeDefaultData();
    
    Utilities.showToast('Usuarios creados: admin@gym.com / admin123');
}

// Función para debug del sistema
function debugAuth() {
    console.log('=== 🔍 DEBUG AUTH ===');
    console.log('Usuario actual:', AuthManager.getCurrentUser());
    console.log('Todos los usuarios:', LocalStorageDriver.getAll('users'));
    
    const keys = Object.keys(localStorage);
    console.log('Claves en localStorage:', keys);
    
    keys.forEach(key => {
        if (key.startsWith('gym_')) {
            console.log(`${key}:`, JSON.parse(localStorage.getItem(key)));
        }
    });
    console.log('=====================');
}

// Función para limpiar todos los datos
function clearAllData() {
    if (confirm('¿Estás seguro de que quieres limpiar TODOS los datos? Esto no se puede deshacer.')) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('gym_')) {
                localStorage.removeItem(key);
            }
        });
        localStorage.removeItem('gym_current_user');
        console.log('🗑️ Todos los datos limpiados');
        Utilities.showToast('Todos los datos han sido limpiados');
        location.reload();
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema Gimnasio iniciado');
    
    // Inicializar datos por defecto
    setTimeout(() => {
        AuthManager.initializeDefaultData();
    }, 1000);
    
    // Agregar botones de debug si estamos en index.html
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setTimeout(() => {
            addDebugButtons();
        }, 2000);
    }
});

// Agregar botones de debug a la página de login
function addDebugButtons() {
    const loginForm = document.querySelector('form');
    if (loginForm) {
        const debugDiv = document.createElement('div');
        debugDiv.className = 'mt-6 p-4 bg-gray-100 rounded-lg';
        debugDiv.innerHTML = `
            <p class="text-sm text-gray-600 mb-2 text-center">🔧 Herramientas de Desarrollo</p>
            <div class="flex flex-wrap gap-2 justify-center">
                <button type="button" onclick="forceCreateUsers()" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded">
                    🛠️ Crear Usuarios
                </button>
                <button type="button" onclick="debugAuth()" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded">
                    🔍 Debug
                </button>
                <button type="button" onclick="clearAllData()" class="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded">
                    🗑️ Limpiar Todo
                </button>
            </div>
            <p class="text-xs text-gray-500 mt-2 text-center">
                Usa: <strong>admin@gym.com</strong> / <strong>admin123</strong>
            </p>
        `;
        loginForm.parentNode.insertBefore(debugDiv, loginForm.nextSibling);
    }
}

// Hacer funciones globales
window.forceCreateUsers = forceCreateUsers;
window.debugAuth = debugAuth;
window.clearAllData = clearAllData;
window.AuthManager = AuthManager;
window.LocalStorageDriver = LocalStorageDriver;
window.Utilities = Utilities;
window.WhatsAppManager = WhatsAppManager;
window.DB = DB;