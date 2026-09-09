import os
import tempfile
import unittest
from projectops import create_app


class ProjectOpsTestCase(unittest.TestCase):
    def setUp(self):
        handle, self.db_path = tempfile.mkstemp(suffix='.db')
        os.close(handle)
        self.app = create_app({'TESTING': True, 'DB_PATH': self.db_path})
        self.client = self.app.test_client()

    def tearDown(self):
        db = self.app.extensions['projectops_db']
        db.close()
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_health(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'UP')

    def test_crud_flow(self):
        payload = {
            'title': 'Python Automation Platform',
            'category': 'Other',
            'difficulty': 'Intermediate',
            'status': 'Planned',
            'owner': 'DevOps Shack',
            'description': 'Build and validate an automation platform using Python and Flask.',
            'repository_url': 'https://github.com/jaiswaladi246'
        }
        created = self.client.post('/api/projects', json=payload)
        self.assertEqual(created.status_code, 201)
        project_id = created.json['data']['id']

        fetched = self.client.get(f'/api/projects/{project_id}')
        self.assertEqual(fetched.status_code, 200)

        payload['status'] = 'Active'
        updated = self.client.put(f'/api/projects/{project_id}', json=payload)
        self.assertEqual(updated.json['data']['status'], 'Active')

        deleted = self.client.delete(f'/api/projects/{project_id}')
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(self.client.get(f'/api/projects/{project_id}').status_code, 404)

    def test_validation(self):
        response = self.client.post('/api/projects', json={})
        self.assertEqual(response.status_code, 400)
        self.assertIn('title', response.json['fields'])


if __name__ == '__main__':
    unittest.main()
