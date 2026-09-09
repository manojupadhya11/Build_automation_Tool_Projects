import os
from projectops import create_app

app = create_app()

if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    print('\n  DevOps Shack — ProjectOps Studio (Python)')
    print(f'  App:      http://localhost:{port}')
    print(f'  API:      http://localhost:{port}/api/projects')
    print(f'  Studio:   http://localhost:{port}/studio')
    print(f'  Health:   http://localhost:{port}/health\n')
    app.run(host=host, port=port, debug=debug)
