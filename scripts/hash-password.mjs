/**
 * Genera el hash bcrypt de la contraseña del admin para insertarlo en
 * Supabase. Este script se corre UNA SOLA VEZ, localmente, y nunca se
 * sube a ningún repositorio con la contraseña en texto plano.
 *
 * Uso:
 *   node scripts/hash-password.mjs "tu-contraseña-aqui"
 *
 * El resultado es un hash que pegas en la tabla admin_users de Supabase
 * (columna password_hash), junto con el username correspondiente.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/hash-password.mjs \"tu-contraseña\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("\nHash generado (cópialo completo):\n");
console.log(hash);
console.log("\nInserta este hash en Supabase con SQL Editor, por ejemplo:\n");
console.log(
  `insert into admin_users (username, password_hash) values ('Joshua', '${hash}');\n`
);
