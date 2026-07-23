const bcrypt = require('bcrypt');
const hash = '$2b$10$yg2jdEHeXi0s7cbz5J8uA.wgLituq1Nfo7/tADOr32FL.fIPpYCOm';

const passwords = ['admin', 'admin123', 'password', 'test123', '123456', 'admin1234', 'Maciej123', 'czarnecki', 'czarnecki123'];
passwords.forEach(p => {
    const result = bcrypt.compareSync(p, hash);
    if (result) console.log('✅ HASŁO TO:', p);
});