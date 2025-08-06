# 🎯 Flask Task Manager

A full-stack web application for task management built with Flask, SQLite, and modern web technologies. Features user authentication, role-based access control, and comprehensive task management capabilities.

## ✨ Features

### 🔐 **Authentication & Authorization**
- User registration and login system
- Secure password hashing (SHA256)
- Session-based authentication
- Role-based access control (User/Admin)
- Protected routes with decorators

### 📋 **Task Management**
- **Create Tasks** with title, description, priority, and due dates
- **Edit Tasks** with full field editing and completion status
- **Delete Tasks** with confirmation dialogs
- **Toggle Completion** status with visual feedback
- **Filter Tasks** by status (All/Pending/Completed) and priority
- **Sort Tasks** by creation date, due date, or priority

### 👑 **Admin Panel**
- **System Overview** with user and task statistics
- **User Management** - view all users with task counts
- **Delete Users** and their associated tasks
- **Global Task View** - see all tasks across the system
- **System-wide Task Management** - delete any task

### 🎨 **Modern UI/UX**
- **Responsive Design** - works on desktop, tablet, and mobile
- **Professional Styling** with CSS Grid and Flexbox
- **Interactive Elements** with hover effects and animations
- **Flash Messages** for user feedback
- **Font Awesome Icons** throughout the interface
- **Clean Navigation** with user context awareness

## 🛠️ Technology Stack

- **Backend:** Flask (Python web framework)
- **Database:** SQLite with Foreign Key relationships
- **Frontend:** HTML5, CSS3, JavaScript
- **Templating:** Jinja2 with template inheritance
- **Icons:** Font Awesome 6.0
- **Authentication:** Flask sessions with secure password hashing

## 📁 Project Structure

```
DailyTracker/
├── app.py                 # Main Flask application
├── database.db           # SQLite database (auto-created)
├── templates/             # Jinja2 templates
│   ├── base.html         # Base template with navigation
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── dashboard.html    # User task dashboard
│   ├── add_task.html     # Add new task form
│   ├── edit_task.html    # Edit task form
│   └── admin.html        # Admin dashboard
├── static/               # Static assets
│   └── style.css         # Complete responsive styling
└── README.md             # This documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation & Setup

1. **Clone or download** the project files to your local machine

2. **Navigate** to the project directory:
   ```bash
   cd DailyTracker
   ```

3. **Install Flask** (if not already installed):
   ```bash
   pip install flask
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```

### Default Admin Account
- **Username:** `admin`
- **Password:** `admin123`

## 📖 Usage Guide

### Getting Started

1. **First Time Setup:**
   - The database is automatically created when you first run the app
   - A default admin account is created automatically
   - Register new user accounts or login as admin

2. **User Registration:**
   - Click "Register here" on the login page
   - Choose a username (3-50 characters)
   - Create a password (minimum 6 characters)
   - Confirm your password

3. **Login:**
   - Enter your username and password
   - Users are redirected to their dashboard
   - Admins are redirected to the admin panel

### Task Management

#### Creating Tasks
1. Click "Add New Task" on the dashboard
2. Fill in the task details:
   - **Title** (required)
   - **Description** (optional)
   - **Priority** (Low/Medium/High/Urgent)
   - **Due Date** (optional)
3. Click "Create Task"

#### Managing Tasks
- **Complete Task:** Click the circle icon next to any task
- **Edit Task:** Click the edit (✏️) button
- **Delete Task:** Click the delete (🗑️) button and confirm

#### Filtering and Sorting
- **Filter by Status:** All Tasks, Pending, Completed
- **Filter by Priority:** All Priorities, Urgent, High, Medium, Low
- **Sort by:** Date Created, Due Date, Priority

### Admin Features

#### User Management
- View all registered users
- See task statistics per user
- Delete users (removes user and all their tasks)
- Cannot delete your own admin account

#### System Overview
- Total users and admin count
- System-wide task statistics
- All tasks across all users
- Delete any task in the system

## 🎨 UI Components

### Navigation Bar
- **Brand Logo** with task icon
- **Dynamic Menu** based on user role
- **User Info** with role badge for admins
- **Logout Button** with confirmation

### Dashboard Cards
- **Statistics Overview** with animated counters
- **Task Cards** with priority indicators
- **Action Buttons** with icons and hover effects

### Forms
- **Responsive Layout** with proper validation
- **Date Pickers** with minimum date constraints
- **Priority Selectors** with emoji indicators
- **Confirmation Dialogs** for destructive actions

## 🔧 Configuration

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'medium',
    is_done INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Environment Variables
- **SECRET_KEY:** Change `your-secret-key-change-in-production` in `app.py` for production use
- **DATABASE:** Modify `DATABASE = 'database.db'` to change database location

## 🚦 API Routes

### Authentication Routes
- `GET/POST /register` - User registration
- `GET/POST /login` - User login
- `GET /logout` - User logout

### Task Management Routes
- `GET /dashboard` - User dashboard with tasks
- `GET/POST /add` - Add new task
- `GET/POST /edit/<id>` - Edit existing task
- `GET /delete/<id>` - Delete task
- `GET /toggle/<id>` - Toggle task completion

### Admin Routes (Admin Only)
- `GET /admin` - Admin dashboard
- `GET /admin/delete_user/<id>` - Delete user
- `GET /admin/delete_task/<id>` - Delete task

## 🔒 Security Features

- **Password Hashing** using SHA256
- **Session Management** with Flask sessions
- **Route Protection** with login_required decorator
- **Admin Protection** with admin_required decorator
- **Input Validation** on all forms
- **SQL Injection Prevention** with parameterized queries
- **CSRF Protection** via Flask session handling

## 📱 Responsive Design

### Desktop (1200px+)
- Full navigation with all menu items
- Multi-column layouts for statistics and filters
- Hover effects and animations

### Tablet (768px - 1199px)
- Responsive grid layouts
- Touch-friendly button sizes
- Collapsible navigation elements

### Mobile (< 768px)
- Single-column layouts
- Stacked navigation menu
- Large touch targets
- Optimized form layouts

## 🔍 Testing the Application

### User Flow Testing
1. **Registration Process:**
   - Test with valid credentials
   - Test validation errors (short password, mismatched passwords)
   - Test duplicate username handling

2. **Task Management:**
   - Create tasks with all field combinations
   - Test edit functionality
   - Test completion toggle
   - Test filtering and sorting

3. **Admin Functions:**
   - Access admin panel
   - Test user deletion
   - Test system-wide task management

### Browser Compatibility
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🐛 Troubleshooting

### Common Issues

#### Database Not Created
- Ensure you have write permissions in the project directory
- Check if `database.db` file appears after first run

#### Flask Not Found
```bash
pip install flask
```

#### Port Already in Use
- Change the port in `app.py`:
```python
app.run(debug=True, port=5001)
```

#### Permission Denied on Database
- Check file permissions on `database.db`
- Ensure the directory is writable

### Debug Mode
The application runs in debug mode by default:
- Automatic reloading on code changes
- Detailed error pages
- Debug console access

## 🚀 Production Deployment

### Security Checklist
- [ ] Change the secret key in `app.py`
- [ ] Set `debug=False` in `app.run()`
- [ ] Use environment variables for sensitive data
- [ ] Implement HTTPS
- [ ] Use a production WSGI server (Gunicorn, uWSGI)
- [ ] Set up proper database backups

### Production WSGI Server
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 📈 Future Enhancements

### Potential Features
- **Email Notifications** for due tasks
- **Task Categories/Tags** for better organization
- **File Attachments** to tasks
- **Task Comments** and collaboration
- **Calendar Integration** with due dates
- **Task Templates** for recurring tasks
- **Export/Import** functionality (CSV, JSON)
- **REST API** for mobile app integration
- **Real-time Updates** with WebSockets
- **Advanced Analytics** and reporting

### Technical Improvements
- **Database Migrations** with Flask-Migrate
- **User Profile** management
- **Password Reset** functionality
- **Two-Factor Authentication**
- **Rate Limiting** for API endpoints
- **Caching** with Redis
- **Background Tasks** with Celery

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the code comments for implementation details
3. Test in different browsers to isolate issues

## 🎉 Acknowledgments

- **Flask** - The Python web framework
- **SQLite** - Embedded database engine
- **Font Awesome** - Icon library
- **CSS Grid/Flexbox** - Modern layout systems

---

**Happy Task Managing! 🎯**

*Built with ❤️ using Flask, SQLite, and modern web technologies* 