# Utils

Core image processing and SVD logic.

- svdCore.ts: SVD decomposition (power iteration core)
- svdCompression.ts: end-to-end load, precompute, reconstruct
- workerCoordinator.ts / svdWorker.ts: web worker orchestration

Tip: Keep compute heavy logic here or in workers.
