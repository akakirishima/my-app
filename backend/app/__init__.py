# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    from .routes import bp
    app.register_blueprint(bp)
    return app

# flask run 用エントリ
app = create_app()
# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
  app = Flask(__name__)
  CORS(app)
  from .routes import bp
  app.register_blueprint(bp)
  return app

# flask run 用エントリ
app = create_app()