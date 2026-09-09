from flask import Flask, jsonify
from .config import Config
from .db import init_database
from .services.project_service import ProjectRepository
from .routes.api import create_api_blueprint
from .routes.pages import create_pages_blueprint


def create_app(config_override=None):
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.config.from_object(Config)
    if config_override:
        app.config.update(config_override)

    db = init_database(app.config['DB_PATH'])
    repository = ProjectRepository(db)
    app.extensions['projectops_db'] = db
    app.extensions['projectops_repository'] = repository

    app.register_blueprint(create_api_blueprint(repository), url_prefix='/api')
    app.register_blueprint(create_pages_blueprint(db, repository))

    @app.get('/health')
    def health():
        return jsonify({
            'status': 'UP',
            'service': 'ProjectOps Studio - Python',
            'runtime': 'Python + Flask',
        })

    @app.errorhandler(404)
    def not_found(_error):
        return 'Not Found', 404

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({'error': 'Internal server error.'}), 500

    return app
