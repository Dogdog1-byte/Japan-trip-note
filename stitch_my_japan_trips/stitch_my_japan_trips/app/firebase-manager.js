
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, onValue, push, update, remove, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Configuration keys
const KEY_DB_URL = 'firebase_db_url';
const KEY_USER_NAME = 'user_name';
const KEY_GROUP_ID = 'group_id'; // New: The shared "password" for the group

let app = null;
let db = null;
let currentUser = null;
let currentGroup = null;
const KEY_SELECTED_TRIP = 'selected_trip_id';

// Initialize automatically if configs exist
export function initApp() {
    const dbUrl = localStorage.getItem(KEY_DB_URL);
    const userName = localStorage.getItem(KEY_USER_NAME);
    const groupId = localStorage.getItem(KEY_GROUP_ID);

    if (dbUrl && userName && groupId) {
        connectFirebase(dbUrl, userName, groupId);
        return true; // Attempting connection
    }
    return false; // Needs setup
}

export function connectFirebase(dbUrl, userName, groupId) {
    if (!dbUrl) return;

    // Save locally
    localStorage.setItem(KEY_DB_URL, dbUrl);
    localStorage.setItem(KEY_USER_NAME, userName);
    localStorage.setItem(KEY_GROUP_ID, groupId);

    currentUser = userName;
    currentGroup = groupId;

    try {
        let projectId = 'japan-trip';
        try {
            const url = new URL(dbUrl);
            const hostParts = url.hostname.split('.');
            if (hostParts[0]) projectId = hostParts[0].replace('-default-rtdb', '');
        } catch (e) { }

        const config = {
            apiKey: "dummy-api-key",
            databaseURL: dbUrl,
            projectId: projectId
        };

        app = initializeApp(config);
        db = getDatabase(app);
        console.log(`Connected to group: ${groupId} as ${userName}`);
        return true;
    } catch (e) {
        console.error("Firebase Connection Failed", e);
        alert("連線失敗，請檢查網址");
        return false;
    }
}

// Sync Trips List (for trips.html)
export function syncTripsList(callback) {
    if (!db || !currentGroup) return;

    const tripsRef = ref(db, `groups/${currentGroup}/trips`);
    onValue(tripsRef, (snapshot) => {
        const data = snapshot.val();
        const trips = data ? Object.values(data) : [];
        // Sort by start date
        trips.sort((a, b) => new Date(a.start) - new Date(b.start));
        callback(trips);
    });
}

// Create New Trip
export function createTrip(tripData) {
    if (!db || !currentGroup) {
        alert("請先設定同步群組");
        return;
    }

    // Auto add ID if not present
    if (!tripData.id) tripData.id = Date.now();
    tripData.createdBy = currentUser;
    tripData.createdAt = new Date().toISOString();

    const tripRef = ref(db, `groups/${currentGroup}/trips/${tripData.id}`);
    return set(tripRef, tripData);
}

// Listen to Single Trip (for detail.html)
export function listenToTrip(tripId, callback) {
    if (!db || !currentGroup) return;

    const tripRef = ref(db, `groups/${currentGroup}/trips/${tripId}`);
    return onValue(tripRef, (snapshot) => {
        const trip = snapshot.val();
        callback(trip);
    });
}

// Update Trip (with Editor tracking)
export async function updateTrip(tripData) {
    if (!db || !currentGroup) return;

    tripData.lastEditor = currentUser;
    tripData.lastEditedAt = new Date().toLocaleString('zh-TW');

    try {
        const tripRef = ref(db, `groups/${currentGroup}/trips/${tripData.id}`);
        await update(tripRef, tripData);
        return true;
    } catch (e) {
        console.error("Update Trip Failed", e);
        return false;
    }
}

// Granular Expense Update
export async function saveExpense(tripId, expense) {
    if (!db || !currentGroup) return false;
    try {
        const expenseRef = ref(db, `groups/${currentGroup}/trips/${tripId}/expenses/${expense.id}`);
        await set(expenseRef, expense);

        // Also update last editor on the trip
        const tripMetaRef = ref(db, `groups/${currentGroup}/trips/${tripId}`);
        await update(tripMetaRef, {
            lastEditor: currentUser,
            lastEditedAt: new Date().toLocaleString('zh-TW')
        });
        return true;
    } catch (e) {
        console.error("Save Expense Failed", e);
        return false;
    }
}

// Granular Expense Delete
export async function deleteExpenseSingle(tripId, expenseId) {
    if (!db || !currentGroup) return false;
    try {
        const expenseRef = ref(db, `groups/${currentGroup}/trips/${tripId}/expenses/${expenseId}`);
        await remove(expenseRef);
        return true;
    } catch (e) {
        console.error("Delete Expense Failed", e);
        return false;
    }
}

// Persistence for selected trip
export function setSelectedTrip(tripId) {
    if (tripId) localStorage.setItem(KEY_SELECTED_TRIP, tripId);
    else localStorage.removeItem(KEY_SELECTED_TRIP);
}

export function getSelectedTrip() {
    return localStorage.getItem(KEY_SELECTED_TRIP);
}

// Delete Trip
export function deleteTrip(tripId) {
    if (!db || !currentGroup) return;
    const tripRef = ref(db, `groups/${currentGroup}/trips/${tripId}`);
    return remove(tripRef);
}

export function getUserName() {
    return localStorage.getItem(KEY_USER_NAME) || '訪客';
}

export function getGroupId() {
    return localStorage.getItem(KEY_GROUP_ID);
}

// User Settings Persistence
export async function saveUserSettings(settings) {
    if (!db || !currentGroup || !currentUser) return;
    const userSettingsRef = ref(db, `groups/${currentGroup}/users/${currentUser}/settings`);
    return set(userSettingsRef, settings);
}

export async function loadUserSettings() {
    if (!db || !currentGroup || !currentUser) return null;
    const userSettingsRef = ref(db, `groups/${currentGroup}/users/${currentUser}/settings`);
    try {
        const snapshot = await get(userSettingsRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
        console.error("Failed to load user settings", e);
        return null;
    }
}
