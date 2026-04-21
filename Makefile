.PHONY: help install backend-install backend-dev backend-test circuits-build contracts-test verify-serve all-test

help:
	@echo "Cibles disponibles :"
	@echo "  make install           -- installe backend + contracts + circuits"
	@echo "  make backend-dev       -- lance l'API FastAPI en hot-reload"
	@echo "  make backend-test      -- exécute la suite pytest"
	@echo "  make circuits-build    -- compile le circuit ZK + teste une preuve"
	@echo "  make contracts-test    -- exécute les tests Hardhat"
	@echo "  make verify-serve      -- sert la page publique de vérification sur :8080"
	@echo "  make all-test          -- enchaîne tous les tests"

install: backend-install
	cd contracts && npm install
	cd circuits && npm install

backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-test:
	cd backend && uv run pytest -q

circuits-build:
	cd circuits && ./scripts/build.sh

contracts-test:
	cd contracts && npx hardhat test

verify-serve:
	cd frontend-verify && python3 -m http.server 8080

all-test: backend-test contracts-test
