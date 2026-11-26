const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.cjs');
const v = require('../middleware/validate.cjs');
const controller = require('../controllers/pengaduanController.cjs');

// Urutan middleware: autentikasi -> otorisasi role -> validasi -> controller.
// Pengecekan kepemilikan & status dilakukan di service (butuh data pengaduan).
router.use(authenticate);

router.get('/', v.validateListQuery, controller.list);
router.get('/:id', v.validateId, controller.getById);
router.post('/', authorize('mahasiswa'), v.validateCreate, controller.create);
router.put('/:id', authorize('mahasiswa'), v.validateId, v.validateUpdate, controller.update);
router.patch('/:id/status', authorize('admin'), v.validateId, v.validateStatus, controller.updateStatus);
router.delete('/:id', authorize('mahasiswa'), v.validateId, controller.remove);

module.exports = router;
