from flask import Blueprint, jsonify, request
from ..services.project_service import CATEGORIES, DIFFICULTIES, STATUSES


def create_api_blueprint(repository):
    bp = Blueprint('api', __name__)

    @bp.get('/projects')
    def list_projects():
        filters = {key: request.args.get(key, '') for key in ('search', 'status', 'category', 'difficulty')}
        return jsonify({'data': repository.list(filters), 'meta': {'filters': filters}})

    @bp.get('/projects/<int:project_id>')
    def get_project(project_id):
        project = repository.find_by_id(project_id)
        if not project:
            return jsonify({'error': 'Project not found.'}), 404
        return jsonify({'data': project})

    @bp.post('/projects')
    def create_project():
        project, errors = repository.create(request.get_json(silent=True) or {})
        if errors:
            return jsonify({'error': 'Validation failed.', 'fields': errors}), 400
        return jsonify({'data': project}), 201

    @bp.put('/projects/<int:project_id>')
    def update_project(project_id):
        project, errors, not_found = repository.update(project_id, request.get_json(silent=True) or {})
        if not_found:
            return jsonify({'error': 'Project not found.'}), 404
        if errors:
            return jsonify({'error': 'Validation failed.', 'fields': errors}), 400
        return jsonify({'data': project})

    @bp.delete('/projects/<int:project_id>')
    def delete_project(project_id):
        if not repository.remove(project_id):
            return jsonify({'error': 'Project not found.'}), 404
        return '', 204

    @bp.get('/stats')
    def stats():
        return jsonify({'data': repository.stats()})

    @bp.get('/metadata')
    def metadata():
        return jsonify({'data': {'categories': CATEGORIES, 'difficulties': DIFFICULTIES, 'statuses': STATUSES}})

    return bp
