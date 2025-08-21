from flask import Flask
from flask_cors import CORS
from .routes import api

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api)
    return app

def main():
    create_app().run(host="0.0.0.0", port=5000, debug=True)

if __name__ == "__main__":
    main()
