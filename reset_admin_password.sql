UPDATE users 
SET password_hash = 'cdd96db6c7cc39f0d70145e47d67fa05:6b92a85786103ce46d418904457be6f7a4be1932d79b3c7ec10cc6da7d1264496093e146f755304a0d6dbe44c2a167dfc8a4416db60a16f3f0dbfea028738a80'
WHERE email = 'tuyishimirehonore3@gmail.com';

SELECT id, email, name, role FROM users WHERE email = 'tuyishimirehonore3@gmail.com';
