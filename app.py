import os
import sqlite3
import hashlib
import click
from flask import Flask, render_template, request, redirect, url_for, g
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# Initialize the Flask application
app = Flask(__name__)

DATABASE = 'minduwc.db'

def get_db():
    """Opens a new database connection if there is none yet for the current application context."""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_connection(exception):
    """Closes the database again at the end of the request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database and creates the users table if it doesn't exist."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.cli.command('init-db')
def init_db_command():
    """Creates the database tables."""
    init_db()
    click.echo('Initialized the database.')

# Define a route for the root URL ("/")
@app.route('/')
def index():
    return render_template('index.html')

# Define a route for the sign-in page, handling both GET and POST
@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """Serves the signin.html page and handles login."""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ? AND password_hash = ?', (email, password_hash)).fetchone()

        if user:
            # Login successful, redirect to home page.
            # In a real app, you would set a session here.
            return redirect(url_for('index'))
        else:
            # Login failed, you can pass an error message to the template
            return render_template('signin.html', error="Invalid credentials. Please try again.")

    return render_template('signin.html')

# Define a route for the registration page
@app.route('/register', methods=['GET', 'POST'])
def register():
    """Serves the registration page and handles new user creation."""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        db = get_db()
        try:
            db.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', (email, password_hash))
            db.commit()
            # Redirect to the sign-in page after successful registration
            return redirect(url_for('signin'))
        except sqlite3.IntegrityError:
            # This error occurs if the email is already registered (due to UNIQUE constraint)
            return render_template('register.html', error="This email address is already registered.")

    return render_template('register.html')

# Run the app in debug mode if this script is executed directly
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)