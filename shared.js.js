// shared.js - CORE DEL SISTEMA
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

class LocalStorageDriver {
    static create(table, data) {
        const items = this.getAll(table);
        const newItem = {
            id: Utilities.generateId(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        items.push(newItem);
        localStorage.setItem(`gym_${table}`, JSON.stringify(items));
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
        return JSON.parse(localStorage.getItem(`gym_${table}`)) || [];
    }
}

class AuthManager {
    static login(email, password) {
        const users = LocalStorageDriver.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('gym_current_user', JSON.stringify(user));
            return user;
        }
        return null;
    }

    static register(userData) {
        const newUser = LocalStorageDriver.create('users', {
            ...userData,
            role: 'member',
            status: 'active'
        });
        return newUser;
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('gym_current_user'));
    }

    static logout() {
        localStorage.removeItem('gym_current_user');
    }

    static hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const roleHierarchy = { 'admin': 3, 'coach': 2, 'member': 1 };
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }
}

class Utilities {
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(date) {
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
        // Implementar toast notifications
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

class WhatsAppManager {
    static sendMessage(phone, message) {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }

    static getMessageTemplates() {
        return {
            payment_reminder: `¡Hola! Te recordamos que tu mensualidad está por vencer. ¡No pierdas tus beneficios! 💪`,
            inactivity_7: `¡Te extrañamos en el gimnasio! Hace 7 días que no nos visitas. ¿Todo bien? 🏋️‍♂️`,
            inactivity_15: `¡Tu cuerpo te está esperando! Hace 15 días que no vienes al gym. ¿Necesitas ayuda con tu rutina?`,
            birthday: `¡Feliz cumpleaños! 🎉 Te regalamos un día extra en tu membresía. ¡Ven a celebrar con nosotros!`,
            promotion: `¡Promoción especial! Este mes tenemos 20% de descuento en suplementos. ¡No te lo pierdas!`
        };
    }
}

// Inicialización del sistema
const DB = new DatabaseAdapter();