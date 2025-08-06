from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import hashlib
from datetime import datetime, date
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'

# Database configuration
DATABASE = 'database.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with tables"""
    conn = get_db_connection()
    
    # Create users table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    ''')
    
    # Create buckets table (like Planner buckets)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS buckets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#667eea',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create tasks table with status and bucket_id
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bucket_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            due_date DATE,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'not_started',
            is_done INTEGER DEFAULT 0,
            assigned_to INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (bucket_id) REFERENCES buckets (id),
            FOREIGN KEY (assigned_to) REFERENCES users (id)
        )
    ''')
    
    # Create default admin user if not exists
    admin_exists = conn.execute(
        'SELECT id FROM users WHERE username = ?', ('admin',)
    ).fetchone()
    
    if not admin_exists:
        admin_password = hash_password('admin123')
        conn.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            ('admin', admin_password, 'admin')
        )
    
    # Create default buckets if not exist
    bucket_exists = conn.execute('SELECT id FROM buckets LIMIT 1').fetchone()
    if not bucket_exists:
        default_buckets = [
            ('To Do', '#17a2b8'),
            ('In Progress', '#ffc107'),
            ('Testing', '#fd7e14'),
            ('Done', '#28a745')
        ]
        for bucket_name, color in default_buckets:
            conn.execute(
                'INSERT INTO buckets (name, color) VALUES (?, ?)',
                (bucket_name, color)
            )
    
    conn.commit()
    conn.close()

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT role FROM users WHERE id = ?', (session['user_id'],)
        ).fetchone()
        conn.close()
        
        if not user or user['role'] != 'admin':
            flash('Admin access required.', 'error')
            return redirect(url_for('dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Home page - redirect to board if logged in, else login"""
    if 'user_id' in session:
        return redirect(url_for('board'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Validation
        if not username or not password:
            flash('Username and password are required.', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html')
        
        conn = get_db_connection()
        
        # Check if username already exists
        existing_user = conn.execute(
            'SELECT id FROM users WHERE username = ?', (username,)
        ).fetchone()
        
        if existing_user:
            flash('Username already exists. Please choose another.', 'error')
            conn.close()
            return render_template('register.html')
        
        # Create new user
        hashed_password = hash_password(password)
        try:
            conn.execute(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                (username, hashed_password, 'user')
            )
            conn.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash('Registration failed. Please try again.', 'error')
        finally:
            conn.close()
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        
        if not username or not password:
            flash('Username and password are required.', 'error')
            return render_template('login.html')
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT id, username, password, role FROM users WHERE username = ?',
            (username,)
        ).fetchone()
        conn.close()
        
        if user and user['password'] == hash_password(password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            
            flash(f'Welcome back, {username}!', 'success')
            
            # Redirect admin to admin panel, users to board
            if user['role'] == 'admin':
                return redirect(url_for('admin'))
            else:
                return redirect(url_for('board'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    username = session.get('username', 'User')
    session.clear()
    flash(f'Goodbye, {username}!', 'info')
    return redirect(url_for('login'))

@app.route('/board')
@login_required
def board():
    """Kanban board view (main dashboard)"""
    conn = get_db_connection()
    
    # Get all buckets
    buckets = conn.execute('SELECT * FROM buckets ORDER BY id').fetchall()
    
    # Get all users for assignment dropdown
    users = conn.execute('SELECT id, username FROM users ORDER BY username').fetchall()
    
    # Get tasks for each bucket
    board_data = []
    for bucket in buckets:
        tasks = conn.execute('''
            SELECT t.*, u.username as assigned_username
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.bucket_id = ?
            ORDER BY t.created_at DESC
        ''', (bucket['id'],)).fetchall()
        
        board_data.append({
            'bucket': bucket,
            'tasks': tasks
        })
    
    # Get statistics
    stats = conn.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            COUNT(*) - SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
        FROM tasks
    ''').fetchone()
    
    conn.close()
    
    return render_template('board.html', 
                         board_data=board_data, 
                         stats=stats,
                         users=users,
                         today=date.today().isoformat())

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard with personal tasks (list view)"""
    conn = get_db_connection()
    
    # Get filter parameters
    filter_status = request.args.get('status', 'all')
    filter_priority = request.args.get('priority', 'all')
    sort_by = request.args.get('sort', 'created_at')
    
    # Build query based on filters
    query = '''
        SELECT t.*, b.name as bucket_name, b.color as bucket_color, u.username as assigned_username
        FROM tasks t
        LEFT JOIN buckets b ON t.bucket_id = b.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE (t.user_id = ? OR t.assigned_to = ?)
    '''
    params = [session['user_id'], session['user_id']]
    
    # Add status filter
    if filter_status == 'completed':
        query += ' AND t.status = "completed"'
    elif filter_status == 'pending':
        query += ' AND t.status != "completed"'
    
    # Add priority filter
    if filter_priority != 'all':
        query += ' AND t.priority = ?'
        params.append(filter_priority)
    
    # Add sorting
    if sort_by == 'due_date':
        query += ' ORDER BY t.due_date ASC, t.created_at DESC'
    elif sort_by == 'priority':
        query += ''' ORDER BY 
            CASE t.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END, t.created_at DESC'''
    else:
        query += ' ORDER BY t.created_at DESC'
    
    tasks = conn.execute(query, params).fetchall()
    
    # Get task statistics for current user
    stats = conn.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            COUNT(*) - SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
        FROM tasks WHERE user_id = ? OR assigned_to = ?
    ''', (session['user_id'], session['user_id'])).fetchone()
    
    conn.close()
    
    return render_template('dashboard.html', 
                         tasks=tasks, 
                         stats=stats,
                         filter_status=filter_status,
                         filter_priority=filter_priority,
                         sort_by=sort_by,
                         today=date.today().isoformat())

@app.route('/add', methods=['GET', 'POST'])
@login_required
def add_task():
    """Add new task"""
    conn = get_db_connection()
    
    # Get buckets and users for dropdowns
    buckets = conn.execute('SELECT * FROM buckets ORDER BY name').fetchall()
    users = conn.execute('SELECT id, username FROM users ORDER BY username').fetchall()
    
    if request.method == 'POST':
        title = request.form['title'].strip()
        description = request.form['description'].strip()
        due_date = request.form['due_date']
        priority = request.form['priority']
        bucket_id = request.form['bucket_id']
        assigned_to = request.form.get('assigned_to') or None
        
        if not title:
            flash('Task title is required.', 'error')
            return render_template('add_task.html', buckets=buckets, users=users)
        
        try:
            conn.execute('''
                INSERT INTO tasks (user_id, bucket_id, title, description, due_date, priority, assigned_to, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (session['user_id'], bucket_id, title, description, due_date or None, priority, assigned_to, 'not_started'))
            conn.commit()
            flash('Task added successfully!', 'success')
            return redirect(url_for('board'))
        except Exception as e:
            flash('Error adding task. Please try again.', 'error')
        finally:
            conn.close()
    
    conn.close()
    return render_template('add_task.html', buckets=buckets, users=users)

@app.route('/edit/<int:task_id>', methods=['GET', 'POST'])
@login_required
def edit_task(task_id):
    """Edit existing task"""
    conn = get_db_connection()
    
    # Get task and verify ownership or assignment
    task = conn.execute(
        'SELECT * FROM tasks WHERE id = ? AND (user_id = ? OR assigned_to = ?)',
        (task_id, session['user_id'], session['user_id'])
    ).fetchone()
    
    if not task:
        flash('Task not found or access denied.', 'error')
        conn.close()
        return redirect(url_for('board'))
    
    # Get buckets and users for dropdowns
    buckets = conn.execute('SELECT * FROM buckets ORDER BY name').fetchall()
    users = conn.execute('SELECT id, username FROM users ORDER BY username').fetchall()
    
    if request.method == 'POST':
        title = request.form['title'].strip()
        description = request.form['description'].strip()
        due_date = request.form['due_date']
        priority = request.form['priority']
        bucket_id = request.form['bucket_id']
        assigned_to = request.form.get('assigned_to') or None
        status = request.form['status']
        
        if not title:
            flash('Task title is required.', 'error')
            conn.close()
            return render_template('edit_task.html', task=task, buckets=buckets, users=users)
        
        try:
            conn.execute('''
                UPDATE tasks 
                SET title = ?, description = ?, due_date = ?, priority = ?, 
                    bucket_id = ?, assigned_to = ?, status = ?
                WHERE id = ? AND (user_id = ? OR assigned_to = ?)
            ''', (title, description, due_date or None, priority, bucket_id, assigned_to, 
                  status, task_id, session['user_id'], session['user_id']))
            conn.commit()
            flash('Task updated successfully!', 'success')
            return redirect(url_for('board'))
        except Exception as e:
            flash('Error updating task. Please try again.', 'error')
    
    conn.close()
    return render_template('edit_task.html', task=task, buckets=buckets, users=users)

@app.route('/move_task', methods=['POST'])
@login_required
def move_task():
    """Move task to different bucket (AJAX endpoint)"""
    task_id = request.form.get('task_id')
    bucket_id = request.form.get('bucket_id')
    
    conn = get_db_connection()
    
    # Update task bucket and status based on bucket
    bucket = conn.execute('SELECT name FROM buckets WHERE id = ?', (bucket_id,)).fetchone()
    
    if bucket:
        # Set status based on bucket name
        status_map = {
            'To Do': 'not_started',
            'In Progress': 'in_progress',
            'Testing': 'testing',
            'Done': 'completed'
        }
        new_status = status_map.get(bucket['name'], 'not_started')
        
        conn.execute(
            'UPDATE tasks SET bucket_id = ?, status = ? WHERE id = ? AND (user_id = ? OR assigned_to = ?)',
            (bucket_id, new_status, task_id, session['user_id'], session['user_id'])
        )
        conn.commit()
        flash('Task moved successfully!', 'success')
    
    conn.close()
    return redirect(url_for('board'))

@app.route('/delete/<int:task_id>')
@login_required
def delete_task(task_id):
    """Delete task"""
    conn = get_db_connection()
    
    # Verify task ownership and delete
    result = conn.execute(
        'DELETE FROM tasks WHERE id = ? AND (user_id = ? OR assigned_to = ?)',
        (task_id, session['user_id'], session['user_id'])
    )
    
    if result.rowcount > 0:
        conn.commit()
        flash('Task deleted successfully!', 'success')
    else:
        flash('Task not found or access denied.', 'error')
    
    conn.close()
    return redirect(url_for('board'))

@app.route('/toggle/<int:task_id>')
@login_required
def toggle_task(task_id):
    """Toggle task completion status"""
    conn = get_db_connection()
    
    # Get current status
    task = conn.execute(
        'SELECT status FROM tasks WHERE id = ? AND (user_id = ? OR assigned_to = ?)',
        (task_id, session['user_id'], session['user_id'])
    ).fetchone()
    
    if task:
        new_status = 'completed' if task['status'] != 'completed' else 'not_started'
        conn.execute(
            'UPDATE tasks SET status = ? WHERE id = ? AND (user_id = ? OR assigned_to = ?)',
            (new_status, task_id, session['user_id'], session['user_id'])
        )
        conn.commit()
        
        status_text = 'completed' if new_status == 'completed' else 'pending'
        flash(f'Task marked as {status_text}!', 'success')
    else:
        flash('Task not found or access denied.', 'error')
    
    conn.close()
    return redirect(url_for('board'))

@app.route('/admin')
@admin_required
def admin():
    """Admin dashboard"""
    conn = get_db_connection()
    
    # Get all users
    users = conn.execute('''
        SELECT u.*, 
               COUNT(t.id) as task_count,
               SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM users u
        LEFT JOIN tasks t ON u.id = t.user_id OR u.id = t.assigned_to
        GROUP BY u.id
        ORDER BY u.username
    ''').fetchall()
    
    # Get all tasks with user info
    tasks = conn.execute('''
        SELECT t.*, u.username, b.name as bucket_name, au.username as assigned_username
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN buckets b ON t.bucket_id = b.id
        LEFT JOIN users au ON t.assigned_to = au.id
        ORDER BY t.created_at DESC
    ''').fetchall()
    
    # Get system statistics
    stats = conn.execute('''
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
            (SELECT COUNT(*) FROM tasks) as total_tasks,
            (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks
    ''').fetchone()
    
    # Get buckets
    buckets = conn.execute('SELECT * FROM buckets ORDER BY name').fetchall()
    
    conn.close()
    
    return render_template('admin.html', users=users, tasks=tasks, stats=stats, buckets=buckets, today=date.today().isoformat())

@app.route('/admin/delete_user/<int:user_id>')
@admin_required
def delete_user(user_id):
    """Delete user and their tasks (admin only)"""
    if user_id == session['user_id']:
        flash('You cannot delete your own account.', 'error')
        return redirect(url_for('admin'))
    
    conn = get_db_connection()
    
    try:
        # Delete user's tasks first
        conn.execute('DELETE FROM tasks WHERE user_id = ? OR assigned_to = ?', (user_id, user_id))
        
        # Delete user
        result = conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        if result.rowcount > 0:
            conn.commit()
            flash('User and their tasks deleted successfully!', 'success')
        else:
            flash('User not found.', 'error')
    except Exception as e:
        flash('Error deleting user. Please try again.', 'error')
    finally:
        conn.close()
    
    return redirect(url_for('admin'))

@app.route('/admin/delete_task/<int:task_id>')
@admin_required
def admin_delete_task(task_id):
    """Delete any task (admin only)"""
    conn = get_db_connection()
    
    result = conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    
    if result.rowcount > 0:
        conn.commit()
        flash('Task deleted successfully!', 'success')
    else:
        flash('Task not found.', 'error')
    
    conn.close()
    return redirect(url_for('admin'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True) 