.PHONY: db-setup backend frontend check test build

db-setup:
	./scripts/setup-local-mysql.sh

backend:
	./scripts/run-backend.sh

frontend:
	./scripts/run-frontend.sh

check:
	./scripts/check-stack.sh

test:
	cd backend && mvn test

build:
	cd backend && mvn clean package
	cd frontend && npm run build
