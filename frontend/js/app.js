if (!requireAuth()) {
    throw new Error('Not authenticated');
}

const currentUser = getCurrentUser();
let tickets = [];
let currentFilter = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    renderUserBar();
    loadTickets();
    setupEventListeners();
});

function renderUserBar() {
    const bar = document.getElementById('userBar');
    if (!bar || !currentUser) return;

    const roleBadgeClass = currentUser.role === 'admin' ? 'role-admin' : 'role-agent';

    bar.innerHTML = `
        <div class="user-info">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
                <span class="user-name">${escapeHtml(currentUser.full_name)}</span>
                <span class="role-badge ${roleBadgeClass}">${escapeHtml(currentUser.role)}</span>
            </div>
        </div>
        <button class="btn-secondary btn-sm" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
    }

    return response;
}

function setupEventListeners() {
    document.getElementById('newTicketBtn').addEventListener('click', () => {
        openModal('newTicketModal');
        document.getElementById('ticketForm').reset();
    });

    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value;
            document.getElementById('clearSearch').style.display = currentSearch ? 'block' : 'none';
            loadTickets();
        }, 300);
    });

    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        currentSearch = '';
        document.getElementById('clearSearch').style.display = 'none';
        loadTickets();
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        loadTickets();
    });

    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmit);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

async function loadTickets() {
    const container = document.getElementById('ticketsContainer');

    try {
        const params = new URLSearchParams();
        if (currentFilter) params.append('status', currentFilter);
        if (currentSearch) params.append('search', currentSearch);

        const response = await apiRequest(`/tickets?${params.toString()}`);
        tickets = await response.json();
        renderTickets(tickets);
        updateStats(tickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load tickets</h3>
                <p style="color: #999; margin-top: 8px;">${escapeHtml(error.message)}</p>
                <button class="btn-primary" style="margin-top: 16px;" onclick="loadTickets()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        showToast(error.message, 'error');
    }
}

function renderTickets(tickets) {
    const container = document.getElementById('ticketsContainer');

    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No tickets found</h3>
                <p style="color: #999; margin-top: 8px;">
                    ${currentSearch || currentFilter ? 'Try adjusting your search or filter' : 'Create your first ticket to get started'}
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-card" onclick="viewTicket('${ticket.ticket_id}')">
            <div class="ticket-id">${escapeHtml(ticket.ticket_id)}</div>
            <div class="ticket-info">
                <div class="ticket-name">${escapeHtml(ticket.customer_name)}</div>
                <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
            </div>
            <div>
                <span class="ticket-status-badge status-${ticket.status.replace(' ', '-')}">
                    ${escapeHtml(ticket.status)}
                </span>
            </div>
            <div class="ticket-date">${formatDate(ticket.created_at)}</div>
        </div>
    `).join('');
}

function updateStats(tickets) {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const closed = tickets.filter(t => t.status === 'Closed').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('openCount').textContent = open;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('closedCount').textContent = closed;
}

async function viewTicket(ticketId) {
    const content = document.getElementById('detailContent');
    content.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading ticket details...</p>
        </div>
    `;
    openModal('detailModal');

    try {
        const response = await apiRequest(`/tickets/${ticketId}`);
        const ticket = await response.json();
        renderDetail(ticket);
    } catch (error) {
        console.error('Error loading ticket:', error);
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load ticket</h3>
                <p style="color: #999;">${escapeHtml(error.message)}</p>
            </div>
        `;
        showToast(error.message, 'error');
    }
}

function renderDetail(ticket) {
    const content = document.getElementById('detailContent');
    document.getElementById('detailTitle').textContent = `Ticket ${ticket.ticket_id}`;

    const isAdmin = currentUser && currentUser.role === 'admin';

    content.innerHTML = `
        <div class="detail-section">
            <h3>Customer Information</h3>
            <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${escapeHtml(ticket.customer_name)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">
                    <a href="mailto:${escapeHtml(ticket.customer_email)}">${escapeHtml(ticket.customer_email)}</a>
                </span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Issue Details</h3>
            <div class="detail-row">
                <span class="detail-label">Subject</span>
                <span class="detail-value">${escapeHtml(ticket.subject)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${escapeHtml(ticket.description)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                    <span class="ticket-status-badge status-${ticket.status.replace(' ', '-')}">
                        ${escapeHtml(ticket.status)}
                    </span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value">${formatDate(ticket.created_at)}</span>
            </div>
            ${ticket.updated_at ? `
                <div class="detail-row">
                    <span class="detail-label">Updated</span>
                    <span class="detail-value">${formatDate(ticket.updated_at)}</span>
                </div>
            ` : ''}
        </div>

        <div class="detail-section">
            <h3>Notes (${ticket.notes ? ticket.notes.length : 0})</h3>
            <div class="detail-notes">
                ${ticket.notes && ticket.notes.length > 0 ?
                    ticket.notes.map(note => `
                        <div class="detail-note">
                            ${escapeHtml(note.note_text)}
                            <div class="detail-note-time">${formatDate(note.created_at)}</div>
                        </div>
                    `).join('') :
                    '<p style="color: #999;">No notes yet</p>'
                }
            </div>
        </div>

        <div class="detail-actions">
            <select id="statusUpdate">
                <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
            <button class="btn-primary" onclick="updateTicket('${ticket.ticket_id}')">
                <i class="fas fa-save"></i> Update Status
            </button>
            ${isAdmin ? `
                <button class="btn-danger" onclick="deleteTicket('${ticket.ticket_id}')">
                    <i class="fas fa-trash"></i> Delete Ticket
                </button>
            ` : ''}
        </div>

        <div class="detail-section" style="margin-top: 24px;">
            <h3>Add Note</h3>
            <div class="add-note-area">
                <textarea id="noteText" placeholder="Add a note to this ticket..."></textarea>
                <button class="btn-primary" onclick="addNote('${ticket.ticket_id}')">
                    <i class="fas fa-plus"></i> Add Note
                </button>
            </div>
        </div>
    `;
}

async function updateTicket(ticketId) {
    const status = document.getElementById('statusUpdate').value;

    try {
        await apiRequest(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        showToast('Ticket updated successfully!', 'success');
        closeModal('detailModal');
        loadTickets();
    } catch (error) {
        console.error('Error updating ticket:', error);
        showToast(error.message, 'error');
    }
}

async function addNote(ticketId) {
    const noteText = document.getElementById('noteText').value.trim();
    if (!noteText) {
        showToast('Please enter a note', 'error');
        return;
    }

    try {
        await apiRequest(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify({ note_text: noteText })
        });

        showToast('Note added successfully!', 'success');
        document.getElementById('noteText').value = '';
        viewTicket(ticketId);
        loadTickets();
    } catch (error) {
        console.error('Error adding note:', error);
        showToast(error.message, 'error');
    }
}

async function deleteTicket(ticketId) {
    if (!confirm(`Delete ticket ${ticketId} permanently? This cannot be undone.`)) return;

    try {
        await apiRequest(`/tickets/${ticketId}`, { method: 'DELETE' });
        showToast('Ticket deleted successfully', 'success');
        closeModal('detailModal');
        loadTickets();
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showToast(error.message, 'error');
    }
}

async function handleTicketSubmit(e) {
    e.preventDefault();

    const formData = {
        customer_name: document.getElementById('customerName').value.trim(),
        customer_email: document.getElementById('customerEmail').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        description: document.getElementById('description').value.trim()
    };

    if (!formData.customer_name || !formData.customer_email ||
        !formData.subject || !formData.description) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await apiRequest('/tickets', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        showToast(`Ticket ${result.ticket_id} created successfully!`, 'success');
        closeModal('newTicketModal');
        document.getElementById('ticketForm').reset();
        loadTickets();
    } catch (error) {
        console.error('Error creating ticket:', error);
        showToast(error.message, 'error');
    }
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    document.body.style.overflow = '';
}

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i><span id="toastMessage"></span>`;
        document.body.appendChild(toast);
    }

    toast.className = `toast ${type}`;
    toast.querySelector('i').className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
    document.getElementById('toastMessage').textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}